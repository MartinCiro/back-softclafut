/**
 * Método para validar y retornar instrucciones y payload decodificado
 * @param { string } payload 
 * @returns { Array } Must return formated array
 * @throws Will throw { message: string } when invalid.
 */
function validateFormat(payload) {
    const FORMATERROR = { message: 'Error de formato' };
    let segments = payload.split(':');

    // It must have 3 segments
    if (segments.length != 3) {
        throw FORMATERROR;
    }

    // Format of the two first segments
    segments[0] = Number(segments[0]);
    segments[1] = segments[1].split('.').map(pos => (parseInt(pos) - 1)).sort((a, b) => a - b);

    // Coherence between the first and the second segment
    if (segments[0] != segments[1].length) {
        throw FORMATERROR;
    }

    // Format of the third segment
    const thirdSegment = Buffer.from(segments[2], 'base64').toString();
    segments[2] = thirdSegment.split('');


    // Coherence between second and third segment
    if (segments[1].length > segments[2].length) {
        throw FORMATERROR;
    }

    return segments;
}

/**
 * Método para decodificar una cadena de texto codificada con el método YAWI
 * @param { string } encodePassword 
 */
function decodePassword(encodePassword) {
    const payloadString = Buffer.from(encodePassword, 'base64').toString();

    const segments = validateFormat(payloadString);

    let password = '';

    for (let position of segments[1]) {
        password += segments[2][position];
    }

    return password;
}


/**
 * Método para encodificar una cadena de texto
 * @param {string} stringToEncode 
 */
function encodePassword(stringToEncode) {
    // This will format the positions and the intercalate string
    const payload = intercalateString(stringToEncode);
    const length = payload[0].length;

    // This will encode the intercalate string with base64
    payload[1] = Buffer.from(payload[1]).toString('base64');

    // Then, this will format the position instructions
    payload[0] = shuffleArray(payload[0]);
    payload[0] = payload[0].join('.');

    // And this will add the length instruction
    payload.unshift(length);

    // Finally, this will encode everythin using base64
    const codedPass = payload.join(':');
    const codedString = Buffer.from(codedPass).toString('base64');

    return codedString;
}

/**
 * Método para intercalar aleatoriamente dígitos aleatorios con una cadena de texto
 * @param { string } originalString 
 * @author ChatGPT & Jorge Loaiza
 */
function intercalateString(originalString) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';

    const originalStringChars = originalString.split('');
    const payload = [];
    const positions = [];

    let stringIndex = 0;
    let newStringIndex = 0;

    while (positions.length < originalString.length) {
        // this will randomly intercalate random digits
        if (Math.random() > 0.5) {
            payload.push(originalStringChars[stringIndex]);
            positions.push(newStringIndex + 1);
            stringIndex++;
        } else {
            payload.push(characters.charAt(Math.floor(Math.random() * characters.length)));
        }

        newStringIndex++;
    }

    return [positions, payload.join('')];
}

/**
 * Método para mezclar elementos de un arreglo
 * @param {Array} array 
 * @author ChatGPT
 */
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

module.exports = {
    decodePassword,
    encodePassword,
}
