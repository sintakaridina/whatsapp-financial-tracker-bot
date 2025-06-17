# Setting up D-Bus and PulseAudio for Puppeteer Bot

To reduce errors related to missing D-Bus socket and audio fallback warnings when running Puppeteer in headless Linux environments, follow these steps:

## 1. Install D-Bus and PulseAudio

On Debian/Ubuntu:

```bash
sudo apt-get update
sudo apt-get install -y dbus pulseaudio
```

## 2. Start D-Bus system service

```bash
sudo service dbus start
```

Or start manually:

```bash
sudo /etc/init.d/dbus start
```

## 3. Start PulseAudio

Run PulseAudio in system mode or per user:

```bash
pulseaudio --start
```

## 4. Verify services

Check if D-Bus socket exists:

```bash
ls /var/run/dbus/system_bus_socket
```

It should exist if D-Bus is running.

## 5. Run your bot

After setting up these services, run your WhatsApp bot again. The errors related to D-Bus and audio should be reduced or gone.

---

If you cannot install or run these services (e.g., in containerized or restricted environments), consider running Puppeteer in non-headless mode as configured, or accept that these warnings are harmless in most cases.
