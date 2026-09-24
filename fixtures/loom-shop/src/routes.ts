import { BillingPage } from "./pages/BillingPage.js";
import { CustomerDetailPage } from "./pages/CustomerDetailPage.js";
import { CustomerPage } from "./pages/CustomerPage.js";
import { MarketingLandingPage } from "./pages/MarketingLandingPage.js";
import { SettingsPage } from "./pages/SettingsPage.js";

export const routes = [
  { path: "/customers", page: CustomerPage },
  { path: "/customers/:id", page: CustomerDetailPage },
  { path: "/billing", page: BillingPage },
  { path: "/settings", page: SettingsPage },
  { path: "/marketing", page: MarketingLandingPage },
];
