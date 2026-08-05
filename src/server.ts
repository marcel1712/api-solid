import Fastify from "fastify";

const fastify = Fastify();

fastify.get("/", async function handler(request, reply) {
  return "Findafriend";
});

async function start() {
  try {
    await fastify.listen({ port: 3000 }).then(() => {
      console.log("HTTP Server Running");
    });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
