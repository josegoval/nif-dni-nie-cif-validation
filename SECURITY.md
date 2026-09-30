# Security policy

## Supported versions

Only the latest release of `nif-dni-nie-cif-validation` receives security fixes. Please upgrade before reporting, and include the version you use.

## Reporting a vulnerability

Please do not open a public issue or pull request for a security problem.

Report it privately through GitHub Security Advisories:

1. Go to the [Security tab](https://github.com/josegoval/nif-dni-nie-cif-validation/security) of the repository.
2. Choose **Report a vulnerability**, or open the [report form](https://github.com/josegoval/nif-dni-nie-cif-validation/security/advisories/new) directly.
3. Describe the problem, the affected versions and, if you can, a minimal input that reproduces it.

The report stays private between you and the maintainer until a fix is released. The maintainer will confirm that it arrived, work on a fix and credit you in the advisory if you want.

## Scope

The package has no runtime dependencies and validates strings locally: it does no network access, file access or code evaluation. Examples of issues in scope are an input that makes a validator hang (for example catastrophic backtracking in a regular expression) or throw when it is documented never to, and a flaw in how the package is built or published. A document that a validator wrongly accepts or rejects is a bug, so please open a normal issue for it.
