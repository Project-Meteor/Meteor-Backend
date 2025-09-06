const { MessageEmbed } = require("discord.js");
const User = require("../../../model/user.js")
const functions = require("../../../structs/functions.js");

module.exports = {
    commandInfo: {
        name: "create",
        description: "Meteor Accountを作成します！",
        options: [
            {
                name: "id",
                description: "あなたのID。特殊記号や日本語、また空白は利用できません。",
                required: true,
                type: 3
            },
            {
                name: "username",
                description: "フォートナイト内のディスプレイネームになります。日本語、特殊記号が利用できます。",
                required: true,
                type: 3
            }
            /*{
                name: "password",
                description: "あなたのパスワード。空白は利用できません。",
                required: true,
                type: 3
            }*/
        ],
    },
    execute: async (interaction) => {
        function generatePassword() {
            const string = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+=';
            const passwordLength = Math.random() * (25 - 5) + 5;
            let myPassword = '';

            for (let i = 0; i < passwordLength; i++) {
                let character = string.charAt(Math.floor(Math.random() * string.length));
                myPassword += character;
            }
            return myPassword;
        }
        await interaction.deferReply({ ephemeral: true });

        const { options } = interaction;

        const discordId = interaction.user.id;
        const email = options.get("id").value + "@meteor.dev";
        const username = options.get("username").value;
        const password = generatePassword();

        const plainEmail = options.get('id').value + "@meteor.dev";
        const plainUsername = options.get('username').value;

        const existingEmail = await User.findOne({ email: plainEmail });
        const existingUser = await User.findOne({ username: plainUsername });

        const emailFilter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        if (!emailFilter.test(email)) {
            return interaction.editReply({ content: "You did not provide a valid email address!", ephemeral: true });
        }
        if (existingEmail) {
            return interaction.editReply({ content: "Email is already in use, please choose another one.", ephemeral: true });
        }
        if (existingUser) {
            return interaction.editReply({ content: "Username already exists. Please choose a different one.", ephemeral: true });
        }
        if (username.length >= 25) {
            return interaction.editReply({ content: "Your username must be less than 25 characters long.", ephemeral: true });
        }
        if (username.length < 3) {
            return interaction.editReply({ content: "Your username must be at least 3 characters long.", ephemeral: true });
        }
        if (password.length >= 128) {
            return interaction.editReply({ content: "Your password must be less than 128 characters long.", ephemeral: true });
        }
        if (password.length < 4) {
            return interaction.editReply({ content: "Your password must be at least 4 characters long.", ephemeral: true });
        }

        await functions.registerUser(discordId, username, email, password).then(resp => {
            let embed = new MessageEmbed()
                .setColor(resp.status >= 400 ? "#ff0000" : "#56ff00")
                .setThumbnail(interaction.user.avatarURL({ format: 'png', dynamic: true, size: 256 }))
                .addFields({
                    name: "Message",
                    value: "アカウント作成に成功しました！以下のログイン情報を大切に保管してください。",
                }, 
                {
                    name: "Email",
                    value: plainEmail,
                },
                {
                    name: "ディスプレイネーム",
                    value: username,
                }, {
                    name: "パスワード",
                    value: `||\`${password}\`|| (クリックして表示)`,
                })
                .setTimestamp()
                .setFooter({
                    text: "Project Meteor",
                    iconURL: "https://i.imgur.com/u29w3Xs.png"
                })

            if (resp.status >= 400) return interaction.editReply({ embeds: [embed], ephemeral: true });

            interaction.user.send({ embeds: [embed] });
            interaction.editReply({ content: "アカウント作成に成功しました！ログイン情報をDMに送信しました。", ephemeral: true });
        });
    }
}