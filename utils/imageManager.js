// 图片管理工具 - 使用应用私有目录

/**
 * 保存图片到本地
 * @param {string} tempFilePath 临时图片路径
 * @returns {Promise<string>} 保存后的路径
 */
export function saveImage(tempFilePath) {
  return new Promise((resolve, reject) => {
    uni.saveFile({
      tempFilePath: tempFilePath,
      success: (res) => {
        console.log('图片添加成功:', res.savedFilePath);
        // 记录保存的路径
        let savedImages = uni.getStorageSync('saved_images') || [];
        savedImages.push(res.savedFilePath);
        uni.setStorageSync('saved_images', savedImages);
        resolve(res.savedFilePath);
      },
      fail: (err) => {
        console.error('添加图片失败:', err);
        reject(err);
      }
    });
  });
}

/**
 * 删除图片
 * @param {string} imagePath 
 */
export function deleteImage(imagePath) {
  return new Promise((resolve, reject) => {
    if (!imagePath) {
      resolve();
      return;
    }
    
    uni.getFileSystemManager().unlink({
      filePath: imagePath,
      success: () => {
        // 从记录中移除
        let savedImages = uni.getStorageSync('saved_images') || [];
        const index = savedImages.indexOf(imagePath);
        if (index > -1) {
          savedImages.splice(index, 1);
          uni.setStorageSync('saved_images', savedImages);
        }
        resolve();
      },
      fail: (err) => {
        console.error('删除图片失败:', err);
        reject(err);
      }
    });
  });
}

/**
 * 清理未使用的图片
 * @param {Array} usedPaths 正在使用的图片路径
 */
export async function cleanUnusedImages(usedPaths = []) {
  const savedImages = uni.getStorageSync('saved_images') || [];
  const toDelete = savedImages.filter(img => !usedPaths.includes(img));
  
  let deleted = 0;
  for (let img of toDelete) {
    try {
      await deleteImage(img);
      deleted++;
    } catch (e) {
      console.error('删除失败:', img);
    }
  }
  
  if (deleted > 0) {
    console.log(`已清理 ${deleted} 张未使用图片`);
  }
  return deleted;
}

/**
 * 清理所有图片
 */
export async function cleanAllImages() {
  const savedImages = uni.getStorageSync('saved_images') || [];
  let deleted = 0;
  for (let img of savedImages) {
    try {
      await deleteImage(img);
      deleted++;
    } catch (e) {
      console.error('删除失败:', img);
    }
  }
  uni.setStorageSync('saved_images', []);
  console.log(`已清理 ${deleted} 张图片`);
  return deleted;
}