import nodemailer from 'nodemailer';

const sendEmail = async (email, subject, message) => {
    try {

        console.log('Sending email to:', email);
        // Check if environment variables are set
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            throw new Error('Email configuration is not set in environment variables');
        }   
        // Create transporter
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER, // Your Gmail address
                pass: process.env.EMAIL_PASS  // Your Gmail password or app password
            }
        });

        // Define email options
        const mailOptions = {
            from: `"${process.env.FROM_NAME}" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: subject,
            text: message,
            html: `<p>${message}</p>` // Optional HTML version
        };

        // Send email
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Email could not be sent');
    }
};

export default sendEmail;