# 🧠 Backend Express API Gateway (`/backend`)

This directory houses our core server engine, Passport authentication strategies, real-time message routes, and CORS verification matrices.

## 🔒 Security & CORS Matrix
This backend enforces secure Cross-Origin validation through environment tracking parameters. Ensure that `PRODUCTION_FRONTEND_URL` matches your active live Vercel endpoint exactly, without trailing slashes.

## 📁 Important Directories
* `src/app.js`: Main server configuration file containing global CORS rules, json body parsing engines, and workspace endpoints.
* `src/routes/`: Isolated sub-routers mapping parameters cleanly for `/api/auth`, `/api/conversations`, `/api/friends`, and `/api/profile`.

## ☁️ Media Attachment & Cloud Storage Architecture

The backend handles real-time file attachments (such as user chat photos and custom profile avatar structures) through an isolated multi-part stream upload pipeline [INDEX_1.1.2]:

1. **Local Ingestion:** Requests are intercepted via `multer` memory storage streams.
2. **Cloud Serialization:** Payloads are handed off securely to the **Cloudinary SDK**, bypassing local disk writes entirely to ensure maximum compatibility with volatile, ephemeral cloud container systems like Railway.
3. **Database Asset Mapping:** Cloudinary returns a secure, optimized fallback HTTPS URL asset link, which Prisma then commits cleanly to your PostgreSQL transaction loops.

### Testing Binaries via MSW
Our integration test harness utilizes customized **Mock Service Worker (MSW)** POST interceptors specifically updated to process binary multi-part stream configurations, rather than relying on static application/json mock fixtures.
