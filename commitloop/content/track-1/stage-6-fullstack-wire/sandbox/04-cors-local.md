## Different ports = different origins

`localhost:5500` and `localhost:3001` are different origins. The browser blocks cross-origin fetch unless the API sends CORS headers allowing your frontend.

Postman works fine. The browser console shows a CORS error. Why?
