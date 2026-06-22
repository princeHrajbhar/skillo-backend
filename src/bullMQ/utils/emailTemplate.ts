export const otpTemplate = (otp: string) => {
  return `
  <div style="font-family: Arial; background:#f4f4f4; padding:20px;">
    <div style="max-width:500px; margin:auto; background:white; padding:20px; border-radius:10px;">
      
      <h2 style="text-align:center;">🔐 Verify Your Account</h2>
      
      <p style="text-align:center;">
        Use the OTP below to verify your account
      </p>

      <div style="text-align:center; margin:30px 0;">
        <span style="font-size:32px; letter-spacing:5px; font-weight:bold; color:#4CAF50;">
          ${otp}
        </span>
      </div>

      <p style="text-align:center; color:#888;">
        Valid for 5 minutes
      </p>

    </div>
  </div>
  `;
};

export const resetPasswordTemplate = (resetUrl: string) => {
  return `
  <div style="font-family: Arial; background:#0f172a; padding:30px;">
    <div style="max-width:500px; margin:auto; background:#111827; padding:30px; border-radius:12px; color:white;">
      
      <h2 style="text-align:center; color:#22c55e;">🔐 Password Reset Request</h2>
      
      <p style="text-align:center; color:#cbd5f5;">
        Click the button below to reset your password securely.
      </p>

      <div style="text-align:center; margin:30px 0;">
        <a href="${resetUrl}" 
           style="
             display:inline-block;
             padding:14px 28px;
             font-size:16px;
             font-weight:bold;
             color:white;
             background:linear-gradient(90deg,#22c55e,#16a34a);
             border-radius:8px;
             text-decoration:none;
           ">
          Reset Password
        </a>
      </div>

      <p style="text-align:center; color:#9ca3af;">
        This link will expire in <b>15 minutes</b>
      </p>

      <p style="text-align:center; font-size:12px; color:#6b7280;">
        If you didn’t request this, ignore this email.
      </p>

    </div>
  </div>
  `;
};