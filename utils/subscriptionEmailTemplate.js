const SubSuccessEmailTemplate = (code) => {
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
          text-align: center;
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
    
      </style>
    </head>
    
    <body>
      <div class="container">
        <h2>You Subscribed ${code} Plan Successfully!</h2>
        <p>Thank you for connecting us!</p>
      </div>
    </body>
    
    </html>
    `
} 

module.exports = SubSuccessEmailTemplate