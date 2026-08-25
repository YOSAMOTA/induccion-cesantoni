const DESTINO_POR_DEFECTO = 'jagarcia@cesantoni.com.mx';
const NOMBRE_HOJA = 'INDUCCIÓN VENDEDOR BOUTIQUE';
const SHEET_ID = '12dA1_pOl08M3ud6lokFJX2vXBaB-_V7zLor3Eh_jySg';

function getSpreadsheet() {
  try { return SpreadsheetApp.openById(SHEET_ID); } catch (e) {}
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss) return ss;
  var files = DriveApp.getFilesByName(NOMBRE_HOJA);
  if (files.hasNext()) return SpreadsheetApp.open(files.next());
  return SpreadsheetApp.create(NOMBRE_HOJA);
}

function getAvances(ss) {
  var sheet = ss.getSheetByName('Avances');
  if (!sheet) {
    sheet = ss.insertSheet('Avances');
    sheet.appendRow(['Clave', 'Nombre', 'Área', '% Avance', 'Actualizado', 'JSON']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getRegistros(ss) {
  var sheet = ss.getSheetByName('Registros');
  if (!sheet) {
    sheet = ss.insertSheet('Registros');
    sheet.appendRow([
      'Fecha envío', 'Nombre', 'Clave', 'Puesto', 'Área / Sucursal',
      'Jefe inmediato', 'Tipo', 'Fecha inicio', 'Correo RH',
      'Correo colaborador', 'Temas completos', 'Total temas', '% Avance',
      'Firma instructor', 'Firma colaborador', 'Detalle temas'
    ]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function findRowByClave(sheet, clave) {
  var last = sheet.getLastRow();
  if (last < 2) return -1;
  var vals = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < vals.length; i++) {
    if (String(vals[i][0]).toUpperCase() === String(clave).toUpperCase()) return i + 2;
  }
  return -1;
}

function guardarAvance(data) {
  var ss = getSpreadsheet();
  var sheet = getAvances(ss);
  var clave = (data.clave || data.nombre || 'SIN_CLAVE').toString().toUpperCase();
  var row = findRowByClave(sheet, clave);
  var line = [
    clave,
    data.nombre || '',
    data.area || '',
    data.porcentaje || 0,
    new Date(),
    JSON.stringify(data.full || data)
  ];
  if (row > 0) sheet.getRange(row, 1, 1, 6).setValues([line]);
  else sheet.appendRow(line);
}

function listaAvances() {
  var sheet = getAvances(getSpreadsheet());
  var last = sheet.getLastRow();
  var out = [];
  if (last < 2) return out;
  var vals = sheet.getRange(2, 1, last - 1, 5).getValues();
  for (var i = 0; i < vals.length; i++) {
    out.push({
      clave: vals[i][0],
      nombre: vals[i][1],
      area: vals[i][2],
      pct: vals[i][3],
      updated: vals[i][4]
    });
  }
  return out;
}

function cargarAvance(clave) {
  var sheet = getAvances(getSpreadsheet());
  var row = findRowByClave(sheet, clave);
  if (row < 0) return null;
  var json = sheet.getRange(row, 6).getValue();
  try { return JSON.parse(json); } catch (e) { return null; }
}

function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    var data = JSON.parse(raw);
    guardarAvance(data);

    if (data.enviarCorreo === true) {
      var ss = getSpreadsheet();
      var sheet = getRegistros(ss);
      sheet.appendRow([
        data.fechaEnvio || new Date(),
        data.nombre || '',
        data.clave || '',
        data.puesto || '',
        data.area || '',
        data.jefe || '',
        data.tipo || '',
        data.fechaInicio || '',
        data.correoDestino || '',
        data.correoColaborador || '',
        data.temasCompletos || 0,
        data.totalTemas || 0,
        data.porcentaje || 0,
        data.firmaInstructor || '',
        data.firmaEmpleado || '',
        data.detalleTemas || ''
      ]);
      var para = data.correoDestino || DESTINO_POR_DEFECTO;
      MailApp.sendEmail({
        to: para,
        cc: data.correoColaborador || '',
        subject: 'Inducción: ' + (data.nombre || 'Colaborador') + ' (' + (data.porcentaje || 0) + '%)',
        body:
          'Nombre: ' + (data.nombre || '') + '\n' +
          'Clave: ' + (data.clave || '') + '\n' +
          'Área: ' + (data.area || '') + '\n' +
          'Avance: ' + (data.porcentaje || 0) + '%\n' +
          'Hoja: ' + ss.getUrl()
      });
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var accion = (e && e.parameter && e.parameter.accion) || '';
  if (accion === 'lista') {
    return ContentService.createTextOutput(JSON.stringify(listaAvances())).setMimeType(ContentService.MimeType.JSON);
  }
  if (accion === 'cargar') {
    var clave = (e.parameter.clave || '');
    return ContentService.createTextOutput(JSON.stringify(cargarAvance(clave) || {})).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput('OK');
}
