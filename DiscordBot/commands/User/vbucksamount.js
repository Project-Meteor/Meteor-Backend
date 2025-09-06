const { MessageEmbed } = require("discord.js");
const Profiles = require('../../../model/profiles.js');
const Users = require('../../../model/user.js');

module.exports = {
    commandInfo: {
        name: "vbucksamount",
        description: "V-Bucksの所持数を確認します",
    },
    execute: async (interaction) => {

    await interaction.deferReply({ ephemeral: true })

    const currentuser = await Users.findOne({ discordId: interaction.user.id });
    const vbucksamount = await Profiles.findOne({ accountId: currentuser?.accountId });
    const currency = vbucksamount?.profiles.common_core.items["Currency:MtxPurchased"].quantity;
    if (!currentuser) 
    {
        return interaction.editReply({ content: "あなたはアカウントを持っていません! **登録してから実行してください!**", ephemeral: true });
    }
    const embed = new MessageEmbed()
        .setTitle("V-Bucks 所持数:")
        .setDescription(`あなたは現在, **` + currency + " V-Bucks** を所持しています！")
        .setTimestamp()
        .setThumbnail('https://i.imgur.com/yLbihQa.png')
        .setFooter({
            text: "Project Meteor",
            iconURL: "https://i.imgur.com/u29w3Xs.png"
        })
        .setColor("WHITE")
    await interaction.editReply({ embeds: [embed], ephemeral: true });
}
}