# Contributing to Devopstrio

We're excited that you're interested in contributing to Devopstrio! This document outlines the process for contributing to our engineering and architecture portal.

## Code of Conduct
By participating in this project, you agree to abide by our standards of professional conduct and engineering excellence.

## How Can I Contribute?

### Reporting Bugs
If you find a technical error in our architecture diagrams or a bug in our infrastructure modules, please open an issue with:
- A clear description of the issue
- Steps to reproduce (if applicable)
- Suggested fix (if known)

### Suggesting Enhancements
We welcome ideas for new reference architectures or platform accelerators. Please open an issue to discuss your proposal before starting work.

### Pull Requests
1. Fork the repository (if you're an external contributor).
2. Create a new branch for your feature or fix.
3. Ensure your documentation follows our [Documentation Standards](GOVERNANCE.md#documentation-standards).
4. Submit a Pull Request with a clear description of the changes.
5. All PRs require review and approval from repository maintainers.

## Engineering Standards
- **Infrastructure as Code**: All cloud resources should be defined using Terraform or Bicep.
- **Documentation First**: Every module must include a `README.md` with deployment instructions.
- **Security by Default**: All configurations must align with CIS or NIST benchmarks.

## Naming Conventions
Follow our standard naming patterns:
- Repository: `capability-focused-naming` (e.g., `ai-landing-zone`)
- Branches: `feature/short-description` or `fix/short-description`

---
Thank you for helping us accelerate cloud innovation!
