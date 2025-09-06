const { MessageEmbed } = require("discord.js");
const User = require("../../../model/user.js");
const Badwords = require("bad-words");
const functions = require("../../../structs/functions.js");

const badwords = new Badwords();

module.exports = {
    commandInfo: {
        name: "change-username",
        description: "ディスプレイネームを変更します。",
        options: [
            {
                name: "username",
                description: "新しいディスプレイネーム。",
                required: true,
                type: 3
            }
        ]
    },
    execute: async (interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const user = await User.findOne({ discordId: interaction.user.id });
        if (!user)
            return interaction.editReply({ content: "あなたはアカウントを持っていません! **登録してから実行してください!**", ephemeral: true });

        const username = interaction.options.getString('username');
        const badwords = ["nigga", "雑魚", "障害者", "俺に負ける", "死ね", "殺す", "殺してやる", "死ねよ", "死ねばいいのに", "氏ね", "氏ねよ", "氏ねばいいのに", "糞", "Fuck", "ちんこ", "ちんぽ", "まんこ"];
        if (badwords.some(badword => username.includes(badword))) {
            return interaction.editReply({ content: "ユーザーネームに不適切な文字列を入れないでください。" });
        }

        const existingUser = await User.findOne({ username: username });
        if (existingUser) {
            return interaction.editReply({ content: "ディスプレイネームが被っています。", ephemeral: true });
        }
        if (username.length >= 25) {
            return interaction.editReply({ content: "ディスプレイネームは25文字以内にしてください。", ephemeral: true });
        }
        if (username.length < 3) {
            return interaction.editReply({ content: "ディスプレイネームは3文字以上である必要があります。", ephemeral: true });
        }
        
        await user.updateOne({ $set: { username: username, username_lower: username.toLowerCase() } });

        const refreshTokenIndex = global.refreshTokens.findIndex(i => i.accountId == user.accountId);
        if (refreshTokenIndex != -1) global.refreshTokens.splice(refreshTokenIndex, 1);

        const accessTokenIndex = global.accessTokens.findIndex(i => i.accountId == user.accountId);
        if (accessTokenIndex != -1) {
            global.accessTokens.splice(accessTokenIndex, 1);

            const xmppClient = global.Clients.find(client => client.accountId == user.accountId);
            if (xmppClient) xmppClient.client.close();
        }

        if (accessTokenIndex != -1 || refreshTokenIndex != -1) {
            await functions.UpdateTokens();
        }

        const embed = new MessageEmbed()
            .setTitle("ユーザーネームが変更できました")
            .setDescription(`新しいディスプレイネームは**${username}**です。`)
            .setColor("GREEN")
            .setFooter({
                text: "Project Meteor",
                iconURL: "https://i.imgur.com/u29w3Xs.png",
            })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed], ephemeral: true });
    }
};