import { Worker, Job } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { transporter } from "../config/mailer.js";

const worker = new Worker(
  "email-tasks",
  async (job: Job) => {
    const { to, subject, html } = job.data;

    console.log(`📩 Sending email to ${to}`);

    await transporter.sendMail({
      from: `"Your App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    return { success: true };
  },
  { connection: redisConnection }
);

worker.on("completed", (job) => {
  console.log(`✅ Email sent (job ${job.id})`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed: ${err.message}`);
});

export default worker;