import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";

export const emailQueue = new Queue("email-tasks", {
  
  connection: redisConnection,
   

  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: true,
    
  },
});

export const addEmailJob = async (data: {
  to: string;
  subject: string;
  html: string;
}) => {
  await emailQueue.add("send-email", data);

};