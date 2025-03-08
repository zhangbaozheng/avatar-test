const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const upload = document.getElementById('upload');
const download = document.getElementById('download');
const imageSizeInput = document.getElementById('image-size');
const sizeValue = document.getElementById('size-value');
const useBgCheckbox = document.getElementById('use-bg');
const bgColorPicker = document.getElementById('bg-color');

console.log(imageSizeInput,'imageSizeInput');

let images = [];
let imageSize = parseInt(imageSizeInput.value);
let useBackgroundImage = useBgCheckbox.checked;
let backgroundColor = bgColorPicker.value;
let backgroundImage = new Image();
backgroundImage.src = './img/bg.png'; // 背景图路径

useBgCheckbox.addEventListener('change', () => {
    useBackgroundImage = useBgCheckbox.checked;
    bgColorPicker.disabled = useBackgroundImage;
    drawImages();
});

bgColorPicker.addEventListener('input', () => {
    backgroundColor = bgColorPicker.value;
    drawImages();
});

function resizeCanvas() {
    canvas.width = Math.min(window.innerWidth * 0.9, 600);
    canvas.height = canvas.width;
    drawImages();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

imageSizeInput.addEventListener('input', (event) => {
    imageSize = parseInt(event.target.value);
    console.log(sizeValue,'sizeValue-sizeValue');
    sizeValue.textContent = imageSize;
    drawImages();
});

upload.addEventListener('change', (event) => {
    const files = event.target.files;
    images = [];
    Array.from(files).forEach((file) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            images.push({ img, x: canvas.width / 2, y: canvas.height / 2 });
            drawImages();
        };
    });
});

function drawImages() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. 先填充背景颜色
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. 先绘制上传的图片
    images.forEach(({ img, x, y }) => {
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(x, y, imageSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x - imageSize / 2, y - imageSize / 2, imageSize, imageSize);
        ctx.restore();
    });

    // 3. 最后绘制背景图片（确保它覆盖在上传图片之上）
    if (useBackgroundImage && backgroundImage.complete) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    }
}

let dragging = null;
function startDrag(event) {
    const x = event.touches ? event.touches[0].clientX - canvas.getBoundingClientRect().left : event.offsetX;
    const y = event.touches ? event.touches[0].clientY - canvas.getBoundingClientRect().top : event.offsetY;
    dragging = images.find(({ x: imgX, y: imgY }) => Math.hypot(x - imgX, y - imgY) <= imageSize / 2);
}
function moveDrag(event) {
    if (dragging) {
        event.preventDefault();
        const x = event.touches ? event.touches[0].clientX - canvas.getBoundingClientRect().left : event.offsetX;
        const y = event.touches ? event.touches[0].clientY - canvas.getBoundingClientRect().top : event.offsetY;
        dragging.x = x;
        dragging.y = y;
        drawImages();
    }
}
function stopDrag() { dragging = null; }

canvas.addEventListener('mousedown', startDrag);
canvas.addEventListener('mousemove', moveDrag);
canvas.addEventListener('mouseup', stopDrag);
canvas.addEventListener('mouseleave', stopDrag);
canvas.addEventListener('touchstart', startDrag, { passive: false });
canvas.addEventListener('touchmove', moveDrag, { passive: false });
canvas.addEventListener('touchend', stopDrag);


const resolutionSelect = document.getElementById('resolution');

download.addEventListener('click', () => {
    const quality = 1.0;
    const resolution = parseInt(resolutionSelect.value);

    // 1. 创建高清离屏 Canvas
    const offscreenCanvas = document.createElement('canvas');
    const offscreenCtx = offscreenCanvas.getContext('2d');
    
    offscreenCanvas.width = canvas.width * resolution;
    offscreenCanvas.height = canvas.height * resolution;
    
    // 2. 先绘制背景颜色（仅当未使用背景图片）
    if (!useBackgroundImage) {
        offscreenCtx.fillStyle = backgroundColor;
        offscreenCtx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
    }

    // 3. 重新绘制 **高分辨率背景图**
    if (useBackgroundImage && backgroundImage.complete) {
        offscreenCtx.drawImage(backgroundImage, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
    }

    // 4. 重新绘制上传的图片（高清）
    images.forEach(({ img, x, y }) => {
        offscreenCtx.save();
        offscreenCtx.globalAlpha = 0.9;
        offscreenCtx.beginPath();
        offscreenCtx.arc(x * resolution, y * resolution, (imageSize / 2) * resolution, 0, Math.PI * 2);
        offscreenCtx.closePath();
        offscreenCtx.clip();
        offscreenCtx.drawImage(img, (x - imageSize / 2) * resolution, (y - imageSize / 2) * resolution, imageSize * resolution, imageSize * resolution);
        offscreenCtx.restore();
    });

    // 5. 高质量导出
    offscreenCanvas.toBlob((blob) => {
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = 'merged-image.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 'image/png', quality);
});
