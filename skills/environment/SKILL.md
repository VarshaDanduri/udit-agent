# UDIT build runbook — clean-slate devcontainer path

Full reproduction of building 4 UDel web apps from a clean Mac, using the
devcontainer base image. Every command executed is below in order.

Covers: **CourseDescription, CoursesSearch, diploma-validation, finalexams**.

---

## 0. Prerequisites on the host (Mac)

Install these once. Versions used here:

```bash
brew install gh git
brew install --cask docker            # Docker Desktop, must be running
brew install --cask visual-studio-code
code --install-extension ms-vscode-remote.remote-containers
```

You also need a **GitHub Personal Access Token (classic)** with these scopes:

- `read:packages` — to pull the dcbase container & resolve UDel Maven packages
- `repo` — to clone the 5 private repos

Authenticate the host once:

```bash
gh auth login                          # web flow, paste the token when prompted
docker login ghcr.io -u <your-gh-username>
# password = the same PAT
```

---

## 1. Workspace and clones

```bash
mkdir -p ~/Downloads/UDIT && cd ~/Downloads/UDIT

git clone https://github.com/University-of-Delaware-IT-ESCS-AD/CourseDescription.git
git clone https://github.com/University-of-Delaware-IT-ESCS-AD/CoursesSearch.git
git clone https://github.com/University-of-Delaware-IT-ESCS-AD/diploma-validation.git
git clone https://github.com/University-of-Delaware-IT-ESCS-AD/finalexams.git
```

Switch each repo to the `devcontainer` branch:

```bash
for repo in CourseDescription CoursesSearch diploma-validation finalexams; do
  ( cd ~/Downloads/UDIT/$repo && git checkout devcontainer )
done
```

---

## 2. dcbase container image

The devcontainer branches reference
`ghcr.io/university-of-delaware-it-escs-ad/artifacts/dcbase:latest`. As of this
writing the org-side ACL for that container has not been granted to outside
collaborators, so we instead pull the same image from the maintainer's personal
GHCR namespace and tag it locally with the org URL the devcontainer expects:

```bash
docker pull ghcr.io/christophermccurdy/dcbase:latest
docker tag  ghcr.io/christophermccurdy/dcbase:latest \
            ghcr.io/university-of-delaware-it-escs-ad/artifacts/dcbase:latest
docker images | grep dcbase
```

Both tags should now point to the same image ID.

When the org ACL is fixed, this whole step becomes a single
`docker pull ghcr.io/university-of-delaware-it-escs-ad/artifacts/dcbase:latest`
and no source files ever change.

---

## 3. Database fixtures (`/opt/apps/data`)

The devcontainers bind-mount three host paths into the container:

```
/opt/apps/data/properties/dbpool   →  /opt/apps/data/properties/dbpool
/opt/apps/data/dbobjects.sql.gz    →  /workspace/dbobjects.sql.gz
/opt/apps/data/sysadm.sql.gz       →  /workspace/sysadm.sql.gz
```

The fixtures live in `data.tar.gz` in this repo. Extract to the bind-mount root
(needs sudo on macOS because `/opt` is root-owned):

```bash
sudo mkdir -p /opt/apps/data
sudo chown $USER /opt/apps/data
tar -xzf ~/Downloads/UDIT/data.tar.gz -C /opt/apps/data/
ls /opt/apps/data/                       # dbobjects.sql.gz, sysadm.sql.gz, properties/
ls /opt/apps/data/properties/dbpool/     # legtst_dbobjects.properties, satst_sysadm.properties
```

---

## 4. Per-repo `.devcontainer/.env`

Each devcontainer launches with `--env-file .devcontainer/.env`. The container's
`/usr/local/bin/on-create.sh` reads `GITHUB_USERNAME` / `GITHUB_TOKEN` from those
env vars to write `~/.m2/settings.xml` so Maven can resolve the private
`edu.udel.itwd:*` packages from GitHub Packages. There's a template `.env.in`
checked in; fill in the real values:

```bash
for repo in CourseDescription CoursesSearch diploma-validation finalexams; do
  cat > ~/Downloads/UDIT/$repo/.devcontainer/.env <<'EOF'
GITHUB_USERNAME=<your-gh-username>
GITHUB_TOKEN=<your-pat>
EOF
done
```

These files are gitignored — they never leave the machine.

---

## 5. Open in container & build (per repo)

For each of the four repos:

```bash
code ~/Downloads/UDIT/CourseDescription
# In VS Code: Cmd+Shift+P → "Dev Containers: Reopen in Container"
```

The first reopen will:

1. Pull / build the devcontainer image with the four SDKMan features layered on
   (Java 21 Temurin, Ant, Maven, Tomcat 10.1.52).
2. Bind-mount `/opt/apps/data/...`.
3. Run `postCreateCommand: /usr/local/bin/on-create.sh` — generates
   `~/.m2/settings.xml` from the env vars and primes the local Maven cache.
4. Run `postStartCommand` — starts nginx + tomcat.
5. Run `postAttachCommand` — `init-dbpools --ignore-globals dbobjects sysadm`
   loads the `.sql.gz` dumps into the dbpools.

Once the container is up, build inside it:

| Repo | Build command |
|---|---|
| CourseDescription | `mvn clean package` |
| CoursesSearch | `ant clean dist` |
| diploma-validation | `mvn clean package` |
| finalexams | `mvn clean package` |

The resulting WARs land in each project's `target/` (Maven) or `dist/` (Ant)
directory and are auto-deployed to the container's Tomcat at port 8080
(forwarded to the host).

---

## 6. Troubleshooting

### 6.1 `bind source path does not exist: /opt/apps/data/...`

Docker Desktop on macOS runs containers inside a Linux VM that can only
bind-mount host paths it's been told to share. By default it shares `/Users`,
`/Volumes`, `/private`, `/tmp` — **not `/opt`**. So `/opt/apps/data` exists on
disk but not from the VM's view.

Fix: Docker Desktop menu bar icon → **Settings → Resources → File sharing**,
click **+**, add `/opt`, then **Apply & Restart**. In VS Code:
**Dev Containers: Rebuild and Reopen in Container**.

### 6.2 `InvalidBaseImagePlatform: pulled with platform "linux/amd64", expected "linux/arm64"`

Warning, not an error. `dcbase` is x86 only; on Apple Silicon it runs under
emulation (slower, but works). Ignore.

### 6.3 Maven dependency resolution: `<artifact> was not found ... resolution is not reattempted`

A previous `mvn` attempt 404'd and Maven cached the failure. Inside the
container:

```bash
rm -rf ~/.m2/repository/edu/udel/itwd/<artifact-name>
cd /tmp
mvn -B -U dependency:get -Dartifact=<groupId>:<artifactId>:<version>
```

Note the `-Dartifact` order: `groupId:artifactId:version[:packaging]`.
Putting `jar` before the version (e.g. `:jar:1.0.0`) makes Maven misparse
`jar` as the version and produces malformed URLs like
`/<artifact>/jar/<artifact>-jar.pom`.

If `dependency:get` still 404s, confirm whether the artifact is actually
published to the org's Maven Packages:

```bash
curl -s -u <gh-username>:<pat> \
  "https://maven.pkg.github.com/University-of-Delaware-IT-ESCS-AD/artifacts/<group-path>/<artifactId>/<version>/" \
  | head -40
```

Empty / 404 there means upstream packaging issue — the maintainer has to
publish the missing JAR. No client-side workaround.

### 6.4 Re-running `on-create.sh`

```bash
cd /workspaces/<RepoName>
/usr/local/bin/on-create.sh
```

**Do not `sudo` this script.** `sudo` resets `PATH` and the SDKMan-managed
`java` / `mvn` binaries become invisible (`java: command not found`).

### 6.5 Tomcat post-start: `cp: cannot stat './staged/lib': No such file or directory`

Cascading failure from §6.3 — when Maven can't resolve a UDel artifact,
`./staged/lib` is never produced, so the Tomcat post-start step fails. Fix
the dependency resolution and rerun `on-create.sh`; this clears.

### 6.6 `Could not find or load main class org.h2.tools.RunScript`

Same cascade. The `init-dbpools` script needs jars that didn't get staged
because `on-create.sh` aborted earlier. Resolve §6.3, rerun `on-create.sh`.

---

## Outstanding (organization-side) work

These are not user-facing build steps; they're permission grants that need to
happen on the UD side before §2's tag alias is unnecessary:

- Grant `darwashiOM` (and other outside collaborators) **Read** on the
  `university-of-delaware-it-escs-ad/artifacts/dcbase` container package via:
  Package settings → "Manage Actions access" / "Invite collaborator".
- Same per-package grant for each of the seven `edu.udel.itwd:*` Maven
  packages (`udeljar`, `springutils`, `jdbcpool`, `json`, `contentDepot-client`,
  `ud-parent-pom`, `ud-dependencies`).

Once both are in place, §2's tag alias becomes a simple
`docker pull ghcr.io/university-of-delaware-it-escs-ad/artifacts/dcbase:latest`.
