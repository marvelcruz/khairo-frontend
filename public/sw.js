self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  const title = data.title || "Khairo Diet Clinic";
  const options = {
    body: data.body || "You have a new notification.",
    icon: "/icon.svg",
    badge: "/icon.svg",
    data: {
      url: data.url || "/dashboard",
    },
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url =
    event.notification.data?.url ||
    "/dashboard";

  event.waitUntil(
    clients.openWindow(url)
  );
});
