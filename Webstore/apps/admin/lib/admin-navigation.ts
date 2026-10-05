export const adminNavigation = [
  { label: "Dashboard", href: "/admin", icon: "dashboard" },
  { label: "Orders", href: "/admin/orders", icon: "orders" },
  { label: "Products", href: "/admin/products", icon: "products" },
  { label: "Categories", href: "/admin/categories", icon: "categories" },
  { label: "Coupons", href: "/admin/coupons", icon: "coupons" },
  { label: "Customers", href: "/admin/customers", icon: "customers" },
  { label: "Payments", href: "/admin/payments", icon: "payments" },
  { label: "Analytics", href: "/admin/analytics", icon: "analytics" },
  { label: "Settings", href: "/admin/settings", icon: "settings" },
] as const;

export function getAdminNavigationItem(pathname: string) {
  return (
    adminNavigation.find(
      (item) =>
        item.href === pathname ||
        (item.href !== "/admin" && pathname.startsWith(`${item.href}/`)),
    ) ?? adminNavigation[0]
  );
}
