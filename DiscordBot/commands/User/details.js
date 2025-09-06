const { MessageEmbed } = require("discord.js");
const User = require("../../../model/user.js");
const Profiles = require('../../../model/profiles.js');

module.exports = {
    commandInfo: {
        name: "details",
        description: "あなたが所持するアカウントの情報を確認します。"
    },
    execute: async (interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const user = await User.findOne({ discordId: interaction.user.id }).lean();
        const vbucksamount = await Profiles.findOne({ accountId: user?.accountId });
        const currency = vbucksamount?.profiles.common_core.items["Currency:MtxPurchased"].quantity;
        if (!user) return interaction.editReply({ content: "あなたはアカウントを持っていません! **登録してから実行してください!**", ephemeral: true });

        let onlineStatus = global.Clients.some(i => i.accountId == user.accountId);

        let embed = new MessageEmbed()
        .setColor("GREEN")
        .setDescription("アカウント情報")
        .setFields(
            { name: 'ディスプレイネーム:', value: user.username },
            { name: 'ID(Email):', value: `${user.email}` },
            { name: "ステータス:", value: `${onlineStatus ? "オンライン" : "オフライン"}` },
            { name: "バンされているか:", value: `${user.banned ? "バンされています" : "されていません"}` },
            { name: 'V-Bucks:', value: `${currency} V-Bucks` },
            { name: "AID:", value: user.accountId })
        .setTimestamp()
        .setThumbnail(interaction.user.avatarURL())
        .setFooter({
            text: "Project Meteor",
            iconURL: "https://i.imgur.com/u29w3Xs.png"
        })

        interaction.editReply({ embeds: [embed], ephemeral: true });
    }
}