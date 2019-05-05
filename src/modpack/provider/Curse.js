import React from 'react';
import ModpackListing from '../Modpack';
import Snackbar from "../../snackbar/Snackbar";

class CurseModpackListing extends ModpackListing {
    constructor(props) {
        super(props);

        // noinspection SpellCheckingInspection
        this.state = {
            modpacks: [
                {
                    id: 269708,
                    name: 'All the Mods 3All the Mods 3All the Mods 3All the Mods 3',
                    slug: 'all-the-mods-3',
                    websiteUrl: 'https://www.curseforge.com/minecraft/modpacks/all-the-mods-3',
                    icon: 'https://media.forgecdn.net/avatars/thumbnails/196/458/256/256/636885406042747877.png',
                    summary: 'All your favorite mods now on 1.12All your favorite mods now on 1.12All your favorite mods now on 1.12All your favorite mods now on 1.12All your favorite mods now on 1.12All your favorite mods now on 1.12All your favorite mods now on 1.12All your favorite mods now on 1.12All your favorite mods now on 1.12',
                    description: '<p><img src="https://i.imgur.com/R3RgVCP.png" alt="" width="498" height="105"></p>rn<p><a href="/linkout?remoteUrl=https%253a%252f%252fwww.reddit.com%252fr%252fallthemods%252fcomments%252fayl6aq%252fserver_list%252f" rel="nofollow"><img src="https://i.imgur.com/wYCbA6c.png" alt="" width="166" height="111"></a> <a href="https://discord.gg/FdFDVWb" rel="nofollow"><img src="https://i.imgur.com/3XOjTB1.png" alt="" width="167" height="111"><img src="https://i.imgur.com/ceNJD8V.png" alt="" width="167" height="111"></a></p>rn<p>&nbsp;</p>rn<p><span><iframe allowfullscreen="allowfullscreen" src="https://www.youtube.com/embed/kKGzCnVWoJA?wmode=transparent" height="358" width="638"></iframe></span></p>rn<p>&nbsp;</p>rn<p>&nbsp;</p>rn<p>&nbsp;</p>rn<p><a href="/linkout?remoteUrl=http%253a%252f%252fwww.akliz.net%252fallthemods" rel="nofollow"><img src="http://i.imgur.com/vGH7XHZ.png" alt="" width="500" height="141">&nbsp;</a></p>rn<p>&nbsp;</p>rn<p>&nbsp;</p>rn<p>&nbsp;</p>rn<p>&nbsp;</p>rn<p>&nbsp;</p>rn<p><span style="font-weight:400"><strong>All the Mods</strong> started out as a private pack for just a few friends of mine that turned into something others wanted to play!&nbsp;</span></p>rn<p>It has all the basics that most other "big name" packs include but with a nice mix of some of newer or lesser-known mods as well.</p>rn<p><span style="font-weight:400">For example; Thaumcraft, Ender IO, Thermal Expansion for the big names and Rustic, Traverse and FastWorkBench for the not as well known!</span></p>rn<p>Can you get to the Creative items by making the "<strong>ATM Star</strong>"?&nbsp;</p>rn<p><span style="font-weight:400">In <strong>All the Mods 3</strong> we will continue the tradition adding many new mods while going for more stability.</span></p>rn<p><strong>Does "All The Mods" really contain </strong><strong>ALL</strong><strong> THE MODS? No, of course not:&nbsp;</strong><a href="/linkout?remoteUrl=https%253a%252f%252frawgit.com%252fAllTheMods%252fATM-3%252fmaster%252fmodlist.html" rel="nofollow"><em><span style="font-weight:400">Modlist</span></em></a></p>rn<p>&nbsp;</p>rn<p><em><span style="font-weight:400">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;</span></em></p>',
                    featured: true,
                    popularity: 13201.7303,
                    downloads: 1449016.0,
                    modified: 1555585342,
                    created: 1497286588,
                    released: 1555389893,
                    primaryAuthor: 'atmteam',
                    authors: [
                        {
                            name: 'atmteam',
                            url: 'https://www.curseforge.com/members/atmteam'
                        },
                        {
                            name: 'whatthedrunk',
                            url: 'https://www.curseforge.com/members/whatthedrunk'
                        },
                    ],
                    attachments: [
                        {
                            id: 217569,
                            default: false,
                            title: 'Custom Items',
                            description: 'Custom items used for optional challenge recipes for creative-only items',
                            url: 'https://media.forgecdn.net/attachments/thumbnails/217/569/310/172/atmtweaks.png'
                        },
                        {
                            id: 217570,
                            default: false,
                            title: 'Have fun building',
                            description: 'Plenty of decoration and visual-based mods to let your creative side go wild',
                            url: 'https://media.forgecdn.net/attachments/thumbnails/217/570/310/172/05ef4b2053-1.jpg'
                        }
                    ],
                    categories: [
                        {
                            id: 4472,
                            name: 'Tech',
                            url: 'https://media.forgecdn.net/avatars/14/479/635596761534662757.png'
                        },
                        {
                            id: 4473,
                            name: 'Magic',
                            url: 'https://media.forgecdn.net/avatars/14/474/635596760578719019.png'
                        },
                        {
                            id: 4476,
                            name: 'Exploration',
                            url: 'https://media.forgecdn.net/avatars/14/486/635596815896417213.png'
                        },
                        {
                            id: 4482,
                            name: 'Extra Large',
                            url: 'https://media.forgecdn.net/avatars/14/472/635596760403562826.png'
                        },
                        {
                            id: 4484,
                            name: 'Multiplayer',
                            url: 'https://media.forgecdn.net/avatars/14/481/635596792838491141.png'
                        },
                    ],
                    gameVersionLatestFiles: [
                        {
                            version: '1.12.2',
                            defaultFile: 2697844,
                            type: 1,
                        },
                        {
                            version: '1.12.2',
                            defaultFile: 2632710,
                            type: 2,
                        },
                        {
                            version: '1.12.2',
                            defaultFile: 2616900,
                            type: 3,
                        },
                    ],
                    defaultFile: 2697844,
                },
                {
                    id: 269708,
                    name: 'All the Mods 3',
                    slug: 'all-the-mods-3',
                    websiteUrl: 'https://www.curseforge.com/minecraft/modpacks/all-the-mods-3',
                    icon: 'https://media.forgecdn.net/avatars/thumbnails/196/458/256/256/636885406042747877.png',
                    summary: 'All your favorite mods now on 1.12',
                    description: '<p><img src="https://i.imgur.com/R3RgVCP.png" alt="" width="498" height="105"></p>rn<p><a href="/linkout?remoteUrl=https%253a%252f%252fwww.reddit.com%252fr%252fallthemods%252fcomments%252fayl6aq%252fserver_list%252f" rel="nofollow"><img src="https://i.imgur.com/wYCbA6c.png" alt="" width="166" height="111"></a> <a href="https://discord.gg/FdFDVWb" rel="nofollow"><img src="https://i.imgur.com/3XOjTB1.png" alt="" width="167" height="111"><img src="https://i.imgur.com/ceNJD8V.png" alt="" width="167" height="111"></a></p>rn<p>&nbsp;</p>rn<p><span><iframe allowfullscreen="allowfullscreen" src="https://www.youtube.com/embed/kKGzCnVWoJA?wmode=transparent" height="358" width="638"></iframe></span></p>rn<p>&nbsp;</p>rn<p>&nbsp;</p>rn<p>&nbsp;</p>rn<p><a href="/linkout?remoteUrl=http%253a%252f%252fwww.akliz.net%252fallthemods" rel="nofollow"><img src="http://i.imgur.com/vGH7XHZ.png" alt="" width="500" height="141">&nbsp;</a></p>rn<p>&nbsp;</p>rn<p>&nbsp;</p>rn<p>&nbsp;</p>rn<p>&nbsp;</p>rn<p>&nbsp;</p>rn<p><span style="font-weight:400"><strong>All the Mods</strong> started out as a private pack for just a few friends of mine that turned into something others wanted to play!&nbsp;</span></p>rn<p>It has all the basics that most other "big name" packs include but with a nice mix of some of newer or lesser-known mods as well.</p>rn<p><span style="font-weight:400">For example; Thaumcraft, Ender IO, Thermal Expansion for the big names and Rustic, Traverse and FastWorkBench for the not as well known!</span></p>rn<p>Can you get to the Creative items by making the "<strong>ATM Star</strong>"?&nbsp;</p>rn<p><span style="font-weight:400">In <strong>All the Mods 3</strong> we will continue the tradition adding many new mods while going for more stability.</span></p>rn<p><strong>Does "All The Mods" really contain </strong><strong>ALL</strong><strong> THE MODS? No, of course not:&nbsp;</strong><a href="/linkout?remoteUrl=https%253a%252f%252frawgit.com%252fAllTheMods%252fATM-3%252fmaster%252fmodlist.html" rel="nofollow"><em><span style="font-weight:400">Modlist</span></em></a></p>rn<p>&nbsp;</p>rn<p><em><span style="font-weight:400">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;</span></em></p>',
                    featured: true,
                    popularity: 13201.7303,
                    downloads: 1449016.0,
                    modified: '1555585342',
                    created: '1497286588',
                    released: '1555389893',
                    primaryAuthor: 'atmteam',
                    authors: [
                        {
                            name: 'atmteam',
                            url: 'https://www.curseforge.com/members/atmteam'
                        },
                        {
                            name: 'whatthedrunk',
                            url: 'https://www.curseforge.com/members/whatthedrunk'
                        },
                    ],
                    attachments: [
                        {
                            id: 217569,
                            default: false,
                            title: 'Custom Items',
                            description: 'Custom items used for optional challenge recipes for creative-only items',
                            url: 'https://media.forgecdn.net/attachments/thumbnails/217/569/310/172/atmtweaks.png'
                        },
                        {
                            id: 217570,
                            default: false,
                            title: 'Have fun building',
                            description: 'Plenty of decoration and visual-based mods to let your creative side go wild',
                            url: 'https://media.forgecdn.net/attachments/thumbnails/217/570/310/172/05ef4b2053-1.jpg'
                        }
                    ],
                    categories: [
                        {
                            id: 4472,
                            name: 'Tech',
                            url: 'https://media.forgecdn.net/avatars/14/479/635596761534662757.png'
                        },
                        {
                            id: 4473,
                            name: 'Magic',
                            url: 'https://media.forgecdn.net/avatars/14/474/635596760578719019.png'
                        },
                        {
                            id: 4476,
                            name: 'Exploration',
                            url: 'https://media.forgecdn.net/avatars/14/486/635596815896417213.png'
                        },
                        {
                            id: 4482,
                            name: 'Extra Large',
                            url: 'https://media.forgecdn.net/avatars/14/472/635596760403562826.png'
                        },
                        {
                            id: 4484,
                            name: 'Multiplayer',
                            url: 'https://media.forgecdn.net/avatars/14/481/635596792838491141.png'
                        },
                    ],
                    gameVersionLatestFiles: [
                        {
                            version: '1.12.2',
                            defaultFile: 2697844,
                            type: 1,
                        },
                        {
                            version: '1.12.2',
                            defaultFile: 2632710,
                            type: 2,
                        },
                        {
                            version: '1.12.2',
                            defaultFile: 2616900,
                            type: 3,
                        },
                    ],
                    defaultFile: 2697844,
                },
            ]
        }
    }

    filter() {
        return (
            <div className="modpack-filter">
                <div className="search">
                    <input id="curseSearch" type="text" placeholder="Search..." />
                    <i className="fas fa-search"></i>
                </div>
                <div className="dropdowns">
                    <select id="curseCategory" name="category">
                        <option value="0">All</option>
                        <option value="4475">Adventure and RPG</option>
                        <option value="4483">Combat / PvP</option>
                        <option value="4476">Exploration</option>
                        <option value="4482">Extra Large</option>
                        <option value="4487">FTB Official</option>
                        <option value="4479">Hardcore</option>
                        <option value="4473">Magic</option>
                        <option value="4480">Map Based</option>
                        <option value="4477">Mini Game</option>
                        <option value="4484">Multiplayer</option>
                        <option value="4478">Quests</option>
                        <option value="4474">Sci-Fi</option>
                        <option value="4736">Skyblock</option>
                        <option value="4481">Small / Light</option>
                        <option value="4472">Tech</option>
                    </select>
                    <select id="curseSortOrder" name="sort-order">
                        <option value="Featured">Featured</option>
                        <option value="TotalDownloads">Downloads</option>
                        <option value="Popularity">Popularity</option>
                        <option value="Name">Name</option>
                        <option value="Author">Author</option>
                        <option value="LastUpdated">Last Updated</option>
                    </select>
                    <select id="curseGameVersion">
                        <option value="1.14">1.14</option>
                        <option value="1.13.2">1.13.2</option>
                    </select>
                </div>
                <div className="refresh">
                    <i className="fas fa-redo flip"></i>
                </div>
            </div>
        );
    }

    onRefresh() {
        Snackbar.sendSnack({
            body: 'Refreshing modpack listings...',
        });


    }

    render() {
        return super.render();
    }
}

export default CurseModpackListing;
