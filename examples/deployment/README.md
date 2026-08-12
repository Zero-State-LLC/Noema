# Deployment fixtures (vendored from Noema-Specs)

| File | Role |
|---|---|
| `local-deployment-config.json` | Valid non-secret local config (port 8080 for this runtime) |
| `invalid-deployment-config-secret-field.json` | Negative: secret field must fail validation |
| `deployment-config.schema.json` | Specs schema reference (validator is pure-Python in `noema.config`) |

```bash
noema-serve --config examples/deployment/local-deployment-config.json
noema-verify --config examples/deployment/local-deployment-config.json --db data/noema.sqlite3
```
