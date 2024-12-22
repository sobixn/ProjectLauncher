const axios = require('axios');
const fs = require('fs').promises;

class SkinManager {
    async getSkinUrl(uuid) {
        try {
            const response = await axios.get(
                `https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`
            );
            const { properties } = response.data;
            const textures = JSON.parse(
                Buffer.from(properties[0].value, 'base64').toString()
            );
            return textures.textures.SKIN.url;
        } catch (error) {
            throw new Error('Failed to fetch skin');
        }
    }

    async downloadSkin(uuid, path) {
        const skinUrl = await this.getSkinUrl(uuid);
        const response = await axios.get(skinUrl, { responseType: 'arraybuffer' });
        await fs.writeFile(path, response.data);
    }
}

module.exports = new SkinManager();