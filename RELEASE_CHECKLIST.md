# Release checklist

- [ ] Check the VS Code base version of Cursor and Windsurf. If any are below 1.97,
      lower engines.vscode and @types/vscode to the oldest version where
      DocumentPasteEditProvider is stable (~1.95), confirm it compiles, and test there.
- [ ] Publish to Open VSX as well as the VS Code Marketplace.
