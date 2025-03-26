# @tldr-pages/labeler

GitHub action that handles labeling PRs for the tldr-pages/tldr repo.

## Usage

```yaml
on: pull_request_target

permissions:
  pull-requests: write

jobs:
  labeler:
    runs-on: ubuntu-latest
    steps:
    - uses: tldr-pages/tldr-labeler-action@7cb29444b818130fe056b7e7b3dedcc7db93af45 # v0.6.0
      with:
        token: "${{ secrets.GITHUB_TOKEN }}"
```

## Contributing

1. Configure and install dependencies: `npm install`
1. Create a new branch `git checkout -b my_branch_name`
1. Make any changes
1. Update the `dist/` files: `npm run build`
1. Push your fork and submit a PR
