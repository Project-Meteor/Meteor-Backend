const { MessageEmbed } = require("discord.js");
const Users = require("../../../model/user.js");
const Profiles = require("../../../model/profiles.js");
const log = require("../../../structs/log.js");
const uuid = require("uuid");

const cooldowns = new Map();

module.exports = {
    commandInfo: {
        name: "giftvbucks",
        description: "V-Bucksを他のユーザーにギフトします。",
        options: [
            {
                name: 'user',
                type: 6,
                description: '対象のディスプレイネームまたはDiscordユーザーを入力してください。',
                required: true,
            },
            {
                name: 'vbucks',
                type: 3,
                description: 'ギフトするV-Bucksの数を入力してください。',
                required: true,
            },
        ],
    },
    async execute(interaction) {
        const recieverUser = interaction.options.getUser("user");

        try {
            const cooldownKey = interaction.user.id;
            const currentTime = Date.now();
            const cooldownTime = 30000;

            if (cooldowns.has(cooldownKey)) {
                const expirationTime = cooldowns.get(cooldownKey) + cooldownTime;

                if (currentTime < expirationTime) {
                    const timeLeft = ((expirationTime - currentTime) / 1000).toFixed(1);
                    return interaction.reply({
                        content: `ギフトしすぎです！ **${timeLeft} 秒** 後にもう一度試してください。`,
                        ephemeral: true
                    });
                }
            }

            await interaction.deferReply({ ephemeral: true });

            const sender = await Users.findOne({ discordId: interaction.user.id });
            const recieverUserId = recieverUser?.id;
            const recieveuser = await Users.findOne({ discordId: recieverUserId });

            if (!recieveuser) {
                return interaction.editReply({ content: "そのユーザーはアカウントを持っていません! ", ephemeral: true });
            }

            if (!sender) {
                return interaction.editReply({ content: "あなたはアカウントを持っていません! **登録してから実行してください!**", ephemeral: true });
            }

            if (recieveuser.id === sender.id) {
                return interaction.editReply({ content: "自分にご褒美を送ろうとしているのですか...?", ephemeral: true });
            }

            const vbucks = parseInt(interaction.options.getString('vbucks'));

            if (isNaN(vbucks)) {
                return interaction.editReply({ content: "V-Bucksの数が正しくありません！", ephemeral: true });
            }

            if (vbucks < 0) {
                return interaction.editReply({ content: "V-Bucksを他人から奪わないでください！", ephemeral: true });
            }

            const currentuser = await Profiles.findOne({ accountId: sender?.accountId });
            const recieverProfile = await Profiles.findOne({ accountId: recieveuser?.accountId });

            if (!currentuser || !recieverProfile) {
                return interaction.editReply({ content: "そのアカウントは見つかりませんでした。", ephemeral: true });
            }

            const senderCommonCore = currentuser.profiles.common_core;
            const recieverCommonCore = recieverProfile.profiles.common_core;

            const senderProfile0 = currentuser.profiles.profile0;
            const recieverProfile0 = recieverProfile.profiles.profile0;

            const sendervbucks = senderCommonCore.items['Currency:MtxPurchased'];
            const recievervbucks = recieverCommonCore.items['Currency:MtxPurchased'];

            if (!sendervbucks) {
                return interaction.editReply({ content: "ユーザー検索に失敗しました", ephemeral: true });
            }

            if (!recievervbucks) {
                return interaction.editReply({ content: "ユーザー検索に失敗しました", ephemeral: true });
            }

            sendervbucks.quantity -= vbucks;
            recievervbucks.quantity += vbucks;

            senderProfile0.items['Currency:MtxPurchased'].quantity -= vbucks;
            recieverProfile0.items['Currency:MtxPurchased'].quantity += vbucks;

            const purchaseId = uuid.v4();
            const lootList = [{
                "itemType": "Currency:MtxGiveaway",
                "itemGuid": "Currency:MtxGiveaway",
                "quantity": vbucks
            }];

            recieverCommonCore.items[purchaseId] = {
                "templateId": `GiftBox:GB_MakeGood`,
                "attributes": {
                    "fromAccountId": sender.accountId,
                    "lootList": lootList,
                    "params": {
                        "userMessage": `${sender.username || "匿名"} からのささやかな贈り物です！`
                    },
                    "giftedOn": new Date().toISOString()
                },
                "quantity": 1
            };

            senderCommonCore.rvn += 1;
            senderCommonCore.commandRevision += 1;

            recieverCommonCore.rvn += 1;
            recieverCommonCore.commandRevision += 1;

            await Profiles.updateOne({ accountId: sender?.accountId }, {
                $set: {
                    'profiles.common_core': senderCommonCore,
                    'profiles.profile0': senderProfile0
                }
            });

            await Profiles.updateOne({ accountId: recieveuser?.accountId }, {
                $set: {
                    'profiles.common_core': recieverCommonCore,
                    'profiles.profile0': recieverProfile0
                }
            });

            let ApplyProfileChanges = [
                {
                    "changeType": "itemQuantityChanged",
                    "itemId": "Currency:MtxPurchased",
                    "quantity": recieverCommonCore.items['Currency:MtxPurchased'].quantity
                },
                {
                    "changeType": "itemQuantityChanged",
                    "itemId": "Currency:MtxPurchased",
                    "quantity": recieverProfile0.items['Currency:MtxPurchased'].quantity
                },
                {
                    "changeType": "itemAdded",
                    "itemId": purchaseId,
                    "templateId": "GiftBox:GB_MakeGood"
                }
            ];

            const embed = new MessageEmbed()
                .setTitle("ギフト完了！")
                .setDescription(`**${vbucks} V-Bucks** を **${recieveuser.username}** にギフトしました！`)
                .setThumbnail("https://i.imgur.com/yLbihQa.png")
                .setColor("GREEN")
                .setFooter({
                    text: "Project Meteor",
                    iconURL: "https://i.imgur.com/u29w3Xs.png"
                });

            await interaction.editReply({ embeds: [embed], ephemeral: true });

            cooldowns.set(cooldownKey, currentTime);

            return {
                profileRevision: recieverCommonCore.rvn,
                profileCommandRevision: recieverCommonCore.commandRevision,
                profileChanges: ApplyProfileChanges,
                newQuantityCommonCore: recieverCommonCore.items['Currency:MtxPurchased'].quantity,
                newQuantityProfile0: recieverProfile0.items['Currency:MtxPurchased'].quantity
            };
        } catch (error) {
            log.error(error);
        }
    },
};