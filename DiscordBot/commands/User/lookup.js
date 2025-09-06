const { MessageEmbed } = require("discord.js");
const Users = require("../../../model/user.js");

module.exports = {
    commandInfo: {
        name: "lookup",
        description: "Discordユーザーまたはディスプレイネームでアカウントを検索します。",
        options: [
            {
                name: "user",
                description: "対象のDiscordユーザーまたはディスプレイネームを入力してください。",
                required: true,
                type: 3
            }
        ]
    },
    execute: async (interaction) => {

    await interaction.deferReply({ ephemeral: true });

    const { options } = interaction;

    const user = await Users.findOne({ username_lower: (options.get("user").value).toLowerCase() }).lean();
    if (!user) return interaction.editReply({ content: "The account username you entered does not exist.", ephemeral: true });

    let onlineStatus = global.Clients.some(i => i.accountId == user.accountId);

    let embed = new MessageEmbed()
        .setColor("GREEN")
        .setDescription(`**ユーザーの情報:**\n- **Discord:** <@${user.discordId}>\n- **ディスプレイネーム:** ${user.username}\n- **バン:** ${user.banned ? "バンされています" : "バンされていません"}\n- **Meteor ステータス:** ${onlineStatus ? "オンライン" : "オフライン"}`)
        .setFooter({
            text: "Project Meteor",
            iconURL: "https://i.imgur.com/u29w3Xs.png"
        })

    interaction.editReply({ embeds: [embed], ephemeral: true });
    }
}