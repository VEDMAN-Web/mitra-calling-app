import swaggerJsdoc from "swagger-jsdoc";
import { securitySchemes, schemas } from "../../swagger/components";
import { keepTag } from "../../swagger/filterByTag";

const routesDir = `${__dirname.replace(/\\/g, "/")}/../routes`;
const userRoutesDir = `${__dirname.replace(/\\/g, "/")}/../../user/routes`;

const spec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Mitra Admin API",
      version: "1.0.0",
      description: `Backend API for Mitra admins: login, partner CRUD + verification review (approve/reject), and user CRUD. Log in with POST /auth/admin/login (credentials come from the ADMIN_EMAIL/ADMIN_PASSWORD env vars) and use the returned JWT as a bearer token on the /admin/* endpoints below.`,
    },
    servers: [{ url: "/api" }],
    components: { securitySchemes, schemas },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    `${userRoutesDir}/auth.routes.{ts,js}`,
    `${routesDir}/partners.routes.{ts,js}`,
    `${routesDir}/users.routes.{ts,js}`,
  ],
}) as any;

export default keepTag(spec, ["Admin", "Admin Partners", "Admin Users"]);
