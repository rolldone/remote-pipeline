import nodemailer from 'nodemailer';

export interface SmtpHookInterface {
  job_id?: string,
  data?: any
  item_info?: {
    from_email?: string,
    from_name?: string,
    host_name?: string,
    username?: string,
    password?: string,
    port?: number,
    to_datas?: Array<string>,
    sso?: string
  }
}

const SmtpHook = async function (props: SmtpHookInterface) {

  let {
    from_email,
    from_name,
    host_name,
    username,
    password,
    port,
    to_datas,
    sso
  } = props.item_info;

  let {
    message,
    to,
    subject
  } = props.data

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: host_name,
    port: port,
    secure: port == 465 ? true : false, // true for 465, false for other ports
    auth: {
      user: username, // generated ethereal user
      pass: password, // generated ethereal password
    },
    tls: {
      ciphers: 'SSLv3'
    }
  });
  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: `"${from_name} " <${from_email}>`, // sender address
    to: to_datas.join(","), // list of receivers
    subject: `${subject}`, // Subject line
    text: `${message}`, // plain text body
    html: "", // html body
  });
  console.log("SmtpHook ::: ", props);
  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}

export default SmtpHook;