const emailTemplate = (code) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
    
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
    
        .container {
          max-width: 600px;
          margin: 20px auto;
          padding: 20px;
          background-color: #fff;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
    
        h2 {
          color: #333;
        }
    
        p {
          color: #666;
        }
    
        .verification-button {
          display: inline-block;
          padding: 10px 20px;
          background-color: #666;
          color: #fff;
          text-decoration: none;
          border-radius: 5px;
          font-weight: 900;
        }
    
        .footer {
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px solid #ccc;
          text-align: center;
        }
      </style>
    </head>
    
    <body>
      <div class="container">
        <h2>Email Verification</h2>
        <p>Dear User,</p>
        <p>Thank you for registering. To complete your registration, please enter the code to verify your email address:</p>
    
        <div style="text-align: center;">
        <small  class="verification-button">${code}</small>
        </div>
    
        <div class="footer">
          <p>This email was sent by Podcast Tonight.</p>
        </div>
      </div>
    </body>
    
    </html>
    
    `
} 

module.exports = emailTemplate