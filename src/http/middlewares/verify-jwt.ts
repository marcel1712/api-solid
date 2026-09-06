import { FastifyReply, FastifyRequest } from "fastify";
import jwt  from "jsonwebtoken";
import env from "@/env/env"


export async function verifyJwt(request: FastifyRequest, reply: FastifyReply){
    const authHeader = request.headers.authorization;

    if(!authHeader){
        return reply.status(401).send({ message: "Unauthorized" });
    }

    const token = authHeader.replace("Bearer ", "");

    try{
        const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string };
        request.orgId = payload.sub;
    } catch {
        return reply.status(401).send({ message: "Unauthorized" });
    }
}