/**
 * Application Configuration
 * Update BACKEND_URL based on your deployment environment
 */

window.__CONFIG = {
  // Development: http://localhost:3000
  // Production: Update this with your deployed backend URL
  // Examples:
  // - Render: https://your-app-name.render.com
  // - Railway: https://your-app-name.up.railway.app
  // - Heroku: https://your-app-name.herokuapp.com
  backendUrl:
    window.location.protocol === "file:"
      ? "http://localhost:3000"
      : "https://wms-pk.solaxpower.com/lunchbox-api", // CHANGE THIS to your deployed backend URL
};
