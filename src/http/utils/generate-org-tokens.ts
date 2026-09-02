import jwt from "jsonwebtoken";
import env from "@/env/env";


export async function generateOrgTokens(orgId: string) {

    const token = await jwt.sign({ sub: orgId }, env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const refreshToken = await jwt.sign({ sub: orgId }, env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return { token, refreshToken }
}