const port = process.env.PORT || 3001

const { PDFDocument,StandardFonts,rgb,degrees } =  require('pdf-lib');
const nodemailer = require("nodemailer");
const express = require("express");
const app = express();
// const cors = require("cors");
const fs = require('fs');
const path = require("path")
var formidable = require('formidable');

// middleware
app.use(express.json());
// app.use(cors());

let serverPath = "https://wefund-nodejs-hmcl7.ondigitalocean.app";

function SendMail(){
  const htmlEmail = `
    <h3>Contact Details</h3>
    <h1><a href="${serverPath}/download_pdf?filename=${pdfFile}">Cllick to see your pdf</a></h1>
    <h3>Message</h3>
    <p>Testing</p>
    `
  let mailOptions = {
    from: `markovitez090@gmail.com`,
    to: email,
    subject: 'Message from: WefundOfficial',
    html: htmlEmail,
    };

  // let transporter = nodemailer.createTransport({
  //   // service: "gmail",
  //   host: 'smtp.gmail.com',
  //   port:587, 
  //   secure: true,
  //   // requireTLS: true,
  //   // service: 'gmail',
  //   auth: {
  //   // type: "OAuth2",
  //   user: "jameszook0902@gmail.com",
  //   pass: "ypsecskymkiccmxa",
  //   // clientId: '958471293842-kipnnfth137ajici3iuka6a92ltbn64e.apps.googleusercontent.com',
  //   // clientSecret: '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',
  //   // refreshToken: process.env.OAUTH_REFRESH_TOKEN,
  //   },
  //   // tls: {rejectUnauthorized: false}
  // });

//   let transporter = nodemailer.createTransport({
// //name: "example.com",
//     host: "smtp.gmail.com",
//     port: 587,
//     secure: false, // use TLS
//     auth: {
//       user: "markovitez090@gmail.com",
//       pass: "MarkoVitez090!",
//     },
//     tls: {
//       // do not fail on invalid certs
//       rejectUnauthorized: false,
//     },
//   });

// transporter.verify(function (error, success) {
//   if (error) {
//     console.log(error);
//   } else {
//     console.log("Server is ready to take our messages");
//   }
// });

//   console.log(mailOptions);

//   transporter.sendMail(mailOptions, function (err, data) {
//     if (err) {
//         console.log(err)
//         return false;
//     } else {
//         console.log("== Message Sent ==");
//         return true;
//     }
//   });

  const apiKey = 'cac494aa-8e59be49';
  const domain = 'mailer.wefund.app';

  const mailgun = require('mailgun-js')({ domain, apiKey });

  mailgun.messages()
    .send({
      from: `wefundofficial@gmail.com`,
        to: 'alenzer0902@gmail.com',
        subject: 'Hello from Mailgun',
        text: 'This is a test'
    })
    .then(res => console.log(res))
    .catch(err => console.log(err));
}

async function editPDF(fields) {

  const url = fields.presale == "true"? 'PDFTemplate_presale.pdf':'PDFTemplate.pdf';
  let existingPdfBytes = fs.readFileSync(url);
  
  const pdfDoc = await PDFDocument.load(existingPdfBytes)
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const pages = pdfDoc.getPages()
  const firstPage = pages[0]
  const { width, height } = firstPage.getSize()

  firstPage.drawText(fields.investAmount, {
    x: 167,
    y: 672,
    size: 12,
    font: helveticaFont,
    color: rgb(0, 0, 0)
  })
  firstPage.drawText(fields.investDate, {
    x: 435,
    y: 672,
    size: 10,
    font: helveticaFont,
    color: rgb(0, 0, 0)
  })

  const nextpage = pages[4] //pdfDoc.addPage()
  nextpage.drawText(fields.investName, {
    x: 366,
    y: 415,
    size: 12,
    font: helveticaFont,
    color: rgb(0, 0, 0)
  })
  nextpage.drawText(fields.investTitle, {
    x: 366,
    y: 391,
    size: 12,
    font: helveticaFont,
    color: rgb(0, 0, 0)
  })
  nextpage.drawText(fields.investEmail, {
    x: 366,
    y: 367,
    size: 12,
    font: helveticaFont,
    color: rgb(0, 0, 0)
  })

  let pngImageBytes = fs.readFileSync(fields.signFile);
  //const jpgImageBytes = await fetch(jpgUrl).then((res) => res.arrayBuffer())
  //const pngImageBytes = await fetch(pngUrl).then((res) => res.arrayBuffer())
  //const pdfDoc = await PDFDocument.create()

  const pngImage = await pdfDoc.embedPng(pngImageBytes)
  // const pngDims = pngImage.scale(0.5)

  nextpage.drawImage(pngImage, {
    x: 340,
    y: 442,
    width: 150,
    height: 50,
  })

  const res = await pdfDoc.save({ dataUri: true });

  var output = fields.investName + "_pdf.pdf";
console.log("write file:" + output);
  fs.writeFileSync("PDF/" + output, res);
  return output;
}


app.post("/pdfmake", async function (req, res) {
  var form = new formidable.IncomingForm();
  form.parse(req, async function (err, fields, files) {
    const sign = fields.investSignature;

    let buff = Buffer.from(sign.substr(22), 'base64');
    fields.signFile = "upload/" + fields.investName + "_sign.png";
    fs.writeFileSync(fields.signFile, buff);

    let pdfFile = await editPDF(fields);
    console.log("Create pdf file:"+pdfFile);

    res.json({
      status: "success",
      data: pdfFile,
    });
  });
});

async function editDocxTemplate(fields)
{
  const PizZip = require("pizzip");
  const Docxtemplater = require("docxtemplater");
  const fs = require("fs");

  var ImageModule = require('docxtemplater-image-module-free');
  const imageOpts = {
      centered: false,
      fileType:"docx",
      getImage: function (tagValue) {
          return fs.readFileSync(tagValue);
      },
      getSize: function (img, tagValue, tagName) {
          return [150, 50];
      },
  };

  const content = fs.readFileSync(
      "DOCXTemplate.docx",
      "binary"
  );
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      modules: [new ImageModule(imageOpts)],
  });

  doc.render({
      tokenName: fields.tokenName,
      title: fields.title,
      company: fields.company,
      description: fields.description,
      ecosystem: fields.ecosystem,
      priceSeed: fields.priceSeed,
      pricePresale: fields.pricePresale,
      priceIDO: fields.priceIDO,
      country: fields.country,
      cofounderName: fields.cofounderName,
      address: fields.address,
      email: fields.email,
      cofounderSignature: fields.cofounderSignFile,

      purchaserSignature: "{%purchaserSignature}",
      purchaserName: "{purchaserName}",
      purchaserTitle: "{purchaserTitle}",
      purchaserEmail: "{purchaserEmail}",
      purchaserAmount: "{purchaserAmount}",
      purchaserDate: "{purchaserDate}"
  });
  
  const buf = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
  });
  
  var output = fields.title + "_SAFT.docx"
  fs.writeFileSync("DOCX/" + output, buf);
  return output;
}

app.post("/docxtemplatemake", async function (req, res) {
  var form = new formidable.IncomingForm();
  form.parse(req, async function (err, fields, files) {

  if(typeof files.file === 'undefined' || files.file == {})
  {
    fields.cofounderSignFile = 'empty.png';
    let docxFile = await editDocxTemplate(fields);
    console.log("Create word file:" + docxFile);

    res.json({
      status: "success",
      data: docxFile,
    });    
  } else {
    var oldpath = files.file.filepath;
    fields.cofounderSignFile = "upload/" + fields.cofounderName + "_sign.png";

    var source = fs.createReadStream(oldpath);
    var dest = fs.createWriteStream(fields.cofounderSignFile);

    source.pipe(dest);
    source.on('end', async function() {
      let docxFile = await editDocxTemplate(fields);
      console.log("Create word file:" + docxFile);

      res.json({
        status: "success",
        data: docxFile,
      });
    });
    source.on('error', function(err) { console.log("move error") });
  }
  });
});

async function editDocx(fields)
{
  const PizZip = require("pizzip");
  const Docxtemplater = require("docxtemplater");
  const fs = require("fs");

  var ImageModule = require('docxtemplater-image-module-free');
  const imageOpts = {
      centered: false,
      fileType:"docx",
      getImage: function (tagValue) {
          return fs.readFileSync(tagValue);
      },
      getSize: function (img, tagValue, tagName) {
          return [150, 50];
      },
  };

  const content = fs.readFileSync(
      "DOCX/" + fields.docxTemplate,
      "binary"
  );
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      modules: [new ImageModule(imageOpts)],
  });

  doc.render({
      purchaserSignature: fields.purchaserSignFile,
      purchaserName: fields.purchaserName,
      purchaserTitle: fields.purchaserTitle,
      purchaserEmail: fields.purchaserEmail,
      purchaserAmount: fields.purchaserAmount,
      purchaserDate: fields.purchaserDate
  });
  
  const buf = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
  });
  
  var output = fields.purchaserName + "_SAFT_COMPLETED.docx"
  fs.writeFileSync("DOCX/" + output, buf);
  return output;
}

app.post("/docxmake", async function (req, res) {
  var form = new formidable.IncomingForm();
  form.parse(req, async function (err, fields, files) {
    const sign = fields.purchaserSignature;
    let buff = Buffer.from(sign.substr(22), 'base64');

    fields.purchaserSignFile = "upload/" + fields.purchaserName.replace(/ /g,'') + "_sign.png";
    fs.writeFileSync(fields.purchaserSignFile, buff);

    let docxFile = await editDocx(fields);
    console.log("Create Completed SAFT file:" + docxFile);

    res.json({
      status: "success",
      data: docxFile,
    });
  });
});

app.post("/uploadWhitepaper", async function (req, res) {
  var form = new formidable.IncomingForm();
  form.parse(req, async function (err, fields, files) {
    var oldpath = files.file.filepath;
    var newFilename = fields.title + "_whitepaper_" + files.file.originalFilename;
    let newpath = "upload/" + newFilename;

    var source = fs.createReadStream(oldpath);
    var dest = fs.createWriteStream(newpath);
    
    source.pipe(dest);
    source.on('end', async function() {
      console.log("whitepaper upload" + newpath);
      res.json({
        status: "success",
        data: newFilename,
      });
    });
    source.on('error', function(err) { console.log("move error") });
  });
});
app.post("/uploadLogo", async function (req, res) {
  var form = new formidable.IncomingForm();
  form.parse(req, async function (err, fields, files) {
    var oldpath = files.file.filepath;
    var newFilename = fields.title + "_logo_" + files.file.originalFilename;
    let newpath = "upload/" + newFilename;

    var source = fs.createReadStream(oldpath);
    var dest = fs.createWriteStream(newpath);
    
    source.pipe(dest);
    source.on('end', async function() {
      console.log("logo upload" + newpath);
      res.json({
        status: "success",
        data: newFilename,
      });
    });
    source.on('error', function(err) { console.log("move error") });
  });
});

app.get("/download_pdf", (req, res) => {
  const file = req.query.filename;

  var filePath = path.join(__dirname, `PDF/${file}`);
  console.log(filePath);
  res.download(filePath);
});

app.get("/download_docx", (req, res) => {
  const file = req.query.filename;

  var filePath = path.join(__dirname, `DOCX/${file}`);
  console.log(filePath);
  res.download(filePath);
});

app.get("/download", (req, res) => {
  const file = req.query.filename;

  var filePath = path.join(__dirname, `upload/${file}`);
  console.log(filePath);
  res.download(filePath);
});

app.post("/checkreferral", (req,res) => {
  var form = new formidable.IncomingForm();
  form.parse(req, async function (err, fields, files) {
    var mysql = require('mysql');

    var con = mysql.createConnection({
      host: "db-mysql-sgp1-60871-do-user-10243971-0.b.db.ondigitalocean.com",
      port: 25060,
      user: "doadmin",
      password: "i262IiKD7u6j46NT",
      database: "WEFUND"
    });

    con.connect(async function(err) {
      if (!err){
console.log("Connected!");

      if(fields.base != ''){
        var sql = "Select * from Referral where base='" + fields.base + "' and referred='" + fields.referred + "'";

        await new Promise((res, rej) => {
          con.query(sql, async function (err, result) {
            if(err) rej(err)
            if (result.length == 0){
              sql = "INSERT INTO Referral (base, referred) VALUES ('" + fields.base + "', '" +
                fields.referred + "')";

              con.query(sql, function (err, result) {
                if(err) rej(err)
                res(result)
              });
            }
            res(result);
          })
        })
      }

      sql = "Select count(base) as referralCount from Referral where base='" + fields.referred + "'";

      con.query(sql, function(err, result){
        if (err){
          res.json({ status: "success", data: '0'});
          return;
        }

        res.json({
          status: "success",
          data: result[0].referralCount,
        });
      })
    }
    });
  });
})
// const port = 3001;
// app.listen(port, () => {
//   console.log(`Server is running on port: ${port}`);
// });

app.get('/', (req, res) => res.send("success"))

app.listen(port, () => console.log(`Server listening on port ${port}!`))
