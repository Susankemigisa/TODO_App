import { type RouteConfig, index, route } from "@react-router/dev/routes";
export default [
  route("/", "routes/landing.tsx"),
  route("home", "routes/home.tsx"),
  route("todos/:id/edit", "routes/todos.edit.tsx"),
  route("signup", "routes/signup.tsx"),
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
  route("auth/google", "routes/auth.google.ts"),
  route("auth/google/callback", "routes/auth.google.callback.ts"),
  route("settings", "routes/settings.tsx"),
  route("forgot-password", "routes/forgot-password.tsx"),
  route("reset-password", "routes/reset-password.tsx"),
] satisfies RouteConfig;