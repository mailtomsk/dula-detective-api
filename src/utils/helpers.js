export function getFullImageUrl(filename, folder = 'scan') {
    if(filename){
    return `${process.env.BACKEND_URL}/uploads/${folder}/${filename}`;
    } else {
        return null;
    }
}
