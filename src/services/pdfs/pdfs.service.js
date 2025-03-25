const PDFDocument = require('pdfkit');
const path = require('path');
const image = path.join(__dirname, '../../src/img/Header.png'); 

const createPDF = async (userPeso, userAltura, userImc, userDieta) => {
  const doc = new PDFDocument();
  let buffers = [];
  
  doc.on('data', buffer => buffers.push(buffer));
  doc.on('end', () => {});
  
  const mensagem = () => {
    if (userImc < 18.5) {
      return "Você está abaixo do peso";
    } else if (userImc >= 18.5 && userImc <= 24.9) {
      return "Você está com peso normal";
    } else if (userImc >= 25 && userImc <= 29.9) {
      return "Você está com sobrepeso";
    } else if (userImc >= 30) {
      return "Você está com obesidade";
    } else {
      return "Por favor, atualize seus dados de peso e altura.";
    }
  };
  
  const agua = userPeso ? 0.035 * userPeso : 0;
  const margin = 40;
  const pageWidth = doc.page.width;
  doc.image(image, 0, 0, { width: pageWidth });
  
  const sanitizeText = (text) => text.replace(/[#@!$%^&*_+=[\]{};'"\\|,<>/?]+/g, '');
  
  let dado = `Com base nas informações fornecidas, seu **peso** é ${userPeso} kg e sua **altura** é ${userAltura} m. A partir desses dados, calculamos seu **IMC**, que é ${parseInt(userImc)}. Com base nisso, ${mensagem()}. Desenvolvemos um plano alimentar totalmente personalizado para você, que recomendamos atualizar após 20 - 30 dias. Recomendamos beber ${agua.toFixed(2)} L de água diariamente.\n`;
  dado += `\nPor favor, não compartilhe este plano alimentar com ninguém, pois ele é exclusivamente personalizado para você.\n\n${userDieta}`;
  dado = sanitizeText(dado);
  
  doc.font('Helvetica').fontSize(12);
  
  let initialYPosition = 150;
  let yOffset = doc.pageCount === 1 ? 150 : 10;
  const lineGap = 10;
  
  doc.text(dado, margin, initialYPosition + yOffset, {
    width: pageWidth - 2 * margin,
    align: 'justify',
    continued: true,
    lineGap: lineGap,
  });
  
  doc.end();
  
  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);
  });
};

const createPDFs = async (texto, img) => {
  const doc = new PDFDocument();
  let buffers = [];
  
  doc.on('data', buffer => buffers.push(buffer));
  doc.on('end', () => {});
  
  const margin = 40;
  const pageWidth = doc.page.width;
  doc.image(img, 0, 0, { width: pageWidth });
  
  const sanitizeText = (text) => text.replace(/[#@!$%^&*_+=[\]{};'"\\|,<>/?]+/g, '');
  
  let dado = sanitizeText(texto);
  
  doc.font('Helvetica').fontSize(12);
  
  let initialYPosition = 150;
  let yOffset = doc.pageCount === 1 ? 150 : 10;
  const lineGap = 10;
  
  doc.text(dado, margin, initialYPosition + yOffset, {
    width: pageWidth - 2 * margin,
    align: 'justify',
    continued: true,
    lineGap: lineGap,
  });
  
  doc.end();
  
  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);
  });
};

module.exports = { createPDF, createPDFs };
