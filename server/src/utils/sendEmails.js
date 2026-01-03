import { Resend } from 'resend';

const resend = new Resend('re_AFhWDk7h_MWyTzEYjFzH1dkc2DdQdggHa');

// Api key = re_AFhWDk7h_MWyTzEYjFzH1dkc2DdQdggHa

const from = process.env.FROM_EMAIL || 'graphicsanimation786@gmail.com';

const { data } = await resend.emails.send({
    from: from,
    to: 'user@gmail.com',
    replyTo: 'you@example.com',
    subject: 'hello world',
    text: 'it works!',
});

console.log(`Email ${data.id} has been sent`);
