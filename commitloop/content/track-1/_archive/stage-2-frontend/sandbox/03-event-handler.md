## Form submit without reload

```javascript
form.addEventListener("submit", (event) => {
  event.preventDefault();
  // your logic here
});
```

Without `preventDefault()`, the browser navigates away and your array resets to whatever was in the initial page load.
