export function getFullImageUrl(filename, folder = 'scan') {
    return `${process.env.BACKEND_URL}/uploads/${folder}/${filename}`;
}
  