import type { ClubhouseDirectoryEntry } from "../domain/clubhouse-directory";

/** Dated concept fixture, checked Oct 8, 2026. Real rosters and pairings from Sleeper;
 * 2025 results from the verified league archive. Three anchors per roster are
 * editorial selections, not a price, power ranking, forecast or starting lineup.
 * Full directory resolved once for player names, then trimmed to Player references. */
export const clubhouseDirectory: ClubhouseDirectoryEntry[] = [
  {
    "identity": {
      "id": "1",
      "name": "Reaves Dropper",
      "managerName": "aidandaly20",
      "avatar": "b319fdf8b7b5b0359d3c78622ba4d70c"
    },
    "currentRecord": {
      "wins": 0,
      "losses": 0,
      "ties": 0
    },
    "players": [
      {
        "id": "1444",
        "fullName": "Damian Lillard",
        "position": "PG",
        "nbaTeam": "POR"
      },
      {
        "id": "1487",
        "fullName": "Tobias Harris",
        "position": "PF",
        "nbaTeam": "SAS"
      },
      {
        "id": "1511",
        "fullName": "Joel Embiid",
        "position": "C",
        "nbaTeam": "PHI"
      },
      {
        "id": "1595",
        "fullName": "Myles Turner",
        "position": "C",
        "nbaTeam": "MIL"
      },
      {
        "id": "1830",
        "fullName": "Derrick White",
        "position": "SG",
        "nbaTeam": "BOS"
      },
      {
        "id": "1959",
        "fullName": "Grayson Allen",
        "position": "SF",
        "nbaTeam": "CHA"
      },
      {
        "id": "2133",
        "fullName": "Anthony Edwards",
        "position": "SG",
        "nbaTeam": "MIN"
      },
      {
        "id": "2142",
        "fullName": "Payton Pritchard",
        "position": "PG",
        "nbaTeam": "BOS"
      },
      {
        "id": "2146",
        "fullName": "Devin Vassell",
        "position": "SF",
        "nbaTeam": "SAS"
      },
      {
        "id": "2157",
        "fullName": "Immanuel Quickley",
        "position": "PG",
        "nbaTeam": "TOR"
      },
      {
        "id": "2281",
        "fullName": "Santi Aldama",
        "position": "PF",
        "nbaTeam": "DAL"
      },
      {
        "id": "2308",
        "fullName": "Alperen Şengün",
        "position": "C",
        "nbaTeam": "HOU"
      },
      {
        "id": "2316",
        "fullName": "Austin Reaves",
        "position": "SG",
        "nbaTeam": "LAL"
      },
      {
        "id": "2454",
        "fullName": "Peyton Watson",
        "position": "SF",
        "nbaTeam": "CLE"
      },
      {
        "id": "2468",
        "fullName": "Max Christie",
        "position": "SG",
        "nbaTeam": "DAL"
      },
      {
        "id": "2568",
        "fullName": "Brandon Miller",
        "position": "SF",
        "nbaTeam": "CHA"
      },
      {
        "id": "2728",
        "fullName": "Donovan Clingan",
        "position": "C",
        "nbaTeam": "POR"
      },
      {
        "id": "2776",
        "fullName": "Daniss Jenkins",
        "position": "PG",
        "nbaTeam": "DET"
      },
      {
        "id": "4742",
        "fullName": "Nolan Traore",
        "position": "PG",
        "nbaTeam": "BKN"
      },
      {
        "id": "4743",
        "fullName": "Danny Wolf",
        "position": "PF",
        "nbaTeam": "BKN"
      },
      {
        "id": "4751",
        "fullName": "Derik Queen",
        "position": "C",
        "nbaTeam": "NOP"
      },
      {
        "id": "4864",
        "fullName": "Yaxel Lendeborg",
        "position": "PF",
        "nbaTeam": "GSW"
      },
      {
        "id": "4865",
        "fullName": "Labaron Philon",
        "position": "PG",
        "nbaTeam": "PHI"
      },
      {
        "id": "4904",
        "fullName": "Bruce Thornton",
        "position": "PG",
        "nbaTeam": "HOU"
      }
    ],
    "featuredPlayerIds": [
      "2133",
      "2308",
      "1511"
    ],
    "previousSeason": {
      "season": "2025",
      "wins": 16,
      "losses": 5,
      "finish": 4,
      "ownerNote": null
    },
    "opener": {
      "leagueWeek": 1,
      "opponentId": "5"
    },
    "recentMove": {
      "dateLabel": "Oct 5",
      "text": "Dropped Ousmane Dieng."
    }
  },
  {
    "identity": {
      "id": "2",
      "name": "Ware the Hoes At?",
      "managerName": "Aedan23",
      "avatar": "0755f578a31478c13226663f38b625bd"
    },
    "currentRecord": {
      "wins": 0,
      "losses": 0,
      "ties": 0
    },
    "players": [
      {
        "id": "1054",
        "fullName": "Kyrie Irving",
        "position": "PG",
        "nbaTeam": "DAL"
      },
      {
        "id": "1739",
        "fullName": "Domantas Sabonis",
        "position": "C",
        "nbaTeam": "SAC"
      },
      {
        "id": "1883",
        "fullName": "Wendell Carter",
        "position": "C",
        "nbaTeam": "ORL"
      },
      {
        "id": "2029",
        "fullName": "P.J. Washington",
        "position": "PF",
        "nbaTeam": "DAL"
      },
      {
        "id": "2156",
        "fullName": "Jalen Smith",
        "position": "C",
        "nbaTeam": "CHI"
      },
      {
        "id": "2259",
        "fullName": "Evan Mobley",
        "position": "C",
        "nbaTeam": "CLE"
      },
      {
        "id": "2285",
        "fullName": "Trey Murphy",
        "position": "SG",
        "nbaTeam": "NOP"
      },
      {
        "id": "2440",
        "fullName": "Mark Williams",
        "position": "C",
        "nbaTeam": "PHX"
      },
      {
        "id": "2457",
        "fullName": "Christian Braun",
        "position": "SG",
        "nbaTeam": "DEN"
      },
      {
        "id": "2458",
        "fullName": "Paolo Banchero",
        "position": "PF",
        "nbaTeam": "ORL"
      },
      {
        "id": "2476",
        "fullName": "Shaedon Sharpe",
        "position": "SG",
        "nbaTeam": "POR"
      },
      {
        "id": "2563",
        "fullName": "Jarace Walker",
        "position": "PF",
        "nbaTeam": "IND"
      },
      {
        "id": "2590",
        "fullName": "Anthony Black",
        "position": "SG",
        "nbaTeam": "ORL"
      },
      {
        "id": "2711",
        "fullName": "Tristan da Silva",
        "position": "SF",
        "nbaTeam": "ORL"
      },
      {
        "id": "2724",
        "fullName": "Isaiah Collier",
        "position": "PG",
        "nbaTeam": "UTA"
      },
      {
        "id": "2725",
        "fullName": "Cody Williams",
        "position": "SG",
        "nbaTeam": "MIN"
      },
      {
        "id": "2726",
        "fullName": "Kel'el Ware",
        "position": "C",
        "nbaTeam": "MIL"
      },
      {
        "id": "2753",
        "fullName": "Jaylen Wells",
        "position": "SF",
        "nbaTeam": "MEM"
      },
      {
        "id": "4737",
        "fullName": "VJ Edgecombe",
        "position": "SG",
        "nbaTeam": "PHI"
      },
      {
        "id": "4740",
        "fullName": "Kon Knueppel",
        "position": "SG",
        "nbaTeam": "CHA"
      },
      {
        "id": "4750",
        "fullName": "Jeremiah Fears",
        "position": "PG",
        "nbaTeam": "NOP"
      },
      {
        "id": "4756",
        "fullName": "Yanic Konan Niederhäuser",
        "position": "C",
        "nbaTeam": "LAC"
      },
      {
        "id": "4758",
        "fullName": "Ace Bailey",
        "position": "SF",
        "nbaTeam": "UTA"
      },
      {
        "id": "4759",
        "fullName": "Kasparas Jakučionis",
        "position": "PG",
        "nbaTeam": "MIL"
      },
      {
        "id": "4871",
        "fullName": "Mikel Brown",
        "position": "PG",
        "nbaTeam": "BKN"
      },
      {
        "id": "4884",
        "fullName": "Nate Ament",
        "position": "PF",
        "nbaTeam": "MIL"
      },
      {
        "id": "4889",
        "fullName": "Bennett Stirtz",
        "position": "PG",
        "nbaTeam": "OKC"
      }
    ],
    "featuredPlayerIds": [
      "2259",
      "2458",
      "1739"
    ],
    "previousSeason": {
      "season": "2025",
      "wins": 12,
      "losses": 9,
      "finish": 5,
      "ownerNote": null
    },
    "opener": {
      "leagueWeek": 1,
      "opponentId": "8"
    },
    "recentMove": null
  },
  {
    "identity": {
      "id": "3",
      "name": "Stephon Castle’s Back",
      "managerName": "TommyDieselfuel",
      "avatar": "b4ecc033a8929c191210e21e87f1b9fa"
    },
    "currentRecord": {
      "wins": 0,
      "losses": 0,
      "ties": 0
    },
    "players": [
      {
        "id": "1792",
        "fullName": "Dillon Brooks",
        "position": "SF",
        "nbaTeam": "PHX"
      },
      {
        "id": "1799",
        "fullName": "Kyle Kuzma",
        "position": "PF",
        "nbaTeam": "MIL"
      },
      {
        "id": "1809",
        "fullName": "John Collins",
        "position": "PF",
        "nbaTeam": "DET"
      },
      {
        "id": "1957",
        "fullName": "Shai Gilgeous-Alexander",
        "position": "PG",
        "nbaTeam": "OKC"
      },
      {
        "id": "2001",
        "fullName": "RJ Barrett",
        "position": "SF",
        "nbaTeam": "TOR"
      },
      {
        "id": "2036",
        "fullName": "Naz Reid",
        "position": "C",
        "nbaTeam": "CHA"
      },
      {
        "id": "2159",
        "fullName": "Isaiah Stewart",
        "position": "C",
        "nbaTeam": "MEM"
      },
      {
        "id": "2289",
        "fullName": "Scottie Barnes",
        "position": "PF",
        "nbaTeam": "TOR"
      },
      {
        "id": "2304",
        "fullName": "Franz Wagner",
        "position": "SF",
        "nbaTeam": "ORL"
      },
      {
        "id": "2461",
        "fullName": "Andrew Nembhard",
        "position": "PG",
        "nbaTeam": "IND"
      },
      {
        "id": "2564",
        "fullName": "Brandin Podziemski",
        "position": "PG",
        "nbaTeam": "GSW"
      },
      {
        "id": "2613",
        "fullName": "Toumani Camara",
        "position": "SF",
        "nbaTeam": "POR"
      },
      {
        "id": "2718",
        "fullName": "Zach Edey",
        "position": "C",
        "nbaTeam": "MEM"
      },
      {
        "id": "2722",
        "fullName": "Stephon Castle",
        "position": "SG",
        "nbaTeam": "SAS"
      },
      {
        "id": "2766",
        "fullName": "Kyle Filipowski",
        "position": "C",
        "nbaTeam": "UTA"
      },
      {
        "id": "2772",
        "fullName": "Ajay Mitchell",
        "position": "PG",
        "nbaTeam": "OKC"
      },
      {
        "id": "4757",
        "fullName": "Walter Clayton",
        "position": "PG",
        "nbaTeam": "MEM"
      },
      {
        "id": "4763",
        "fullName": "Yang Hansen",
        "position": "C",
        "nbaTeam": "POR"
      },
      {
        "id": "4777",
        "fullName": "Ryan Kalkbrenner",
        "position": "C",
        "nbaTeam": "CHA"
      },
      {
        "id": "4875",
        "fullName": "Zuby Ejiofor",
        "position": "C",
        "nbaTeam": "ATL"
      },
      {
        "id": "4876",
        "fullName": "Kingston Flemings",
        "position": "PG",
        "nbaTeam": "ATL"
      },
      {
        "id": "4891",
        "fullName": "Darius Acuff",
        "position": "PG",
        "nbaTeam": "SAC"
      }
    ],
    "featuredPlayerIds": [
      "1957",
      "2289",
      "2304"
    ],
    "previousSeason": {
      "season": "2025",
      "wins": 4,
      "losses": 17,
      "finish": 7,
      "ownerNote": null
    },
    "opener": {
      "leagueWeek": 1,
      "opponentId": "4"
    },
    "recentMove": {
      "dateLabel": "Oct 5",
      "text": "Dropped Oscar Tshiebwe; Added Isaiah Stewart."
    }
  },
  {
    "identity": {
      "id": "4",
      "name": "The Fun Guys",
      "managerName": "philbiag",
      "avatar": "6d8c2588f45bdd517d5b3eb83049108d"
    },
    "currentRecord": {
      "wins": 0,
      "losses": 0,
      "ties": 0
    },
    "players": [
      {
        "id": "1308",
        "fullName": "Kawhi Leonard",
        "position": "SF",
        "nbaTeam": "TOR"
      },
      {
        "id": "1913",
        "fullName": "Miles Bridges",
        "position": "PF",
        "nbaTeam": "PHX"
      },
      {
        "id": "1967",
        "fullName": "Jalen Brunson",
        "position": "PG",
        "nbaTeam": "NYK"
      },
      {
        "id": "1988",
        "fullName": "Michael Porter",
        "position": "SF",
        "nbaTeam": "BKN"
      },
      {
        "id": "1998",
        "fullName": "Coby White",
        "position": "PG",
        "nbaTeam": "CHA"
      },
      {
        "id": "2032",
        "fullName": "Nic Claxton",
        "position": "C",
        "nbaTeam": "CHI"
      },
      {
        "id": "2054",
        "fullName": "Zion Williamson",
        "position": "PF",
        "nbaTeam": "NOP"
      },
      {
        "id": "2055",
        "fullName": "Nickeil Alexander-Walker",
        "position": "SG",
        "nbaTeam": "ATL"
      },
      {
        "id": "2090",
        "fullName": "Ty Jerome",
        "position": "PG",
        "nbaTeam": "MEM"
      },
      {
        "id": "2126",
        "fullName": "Tyrese Maxey",
        "position": "PG",
        "nbaTeam": "PHI"
      },
      {
        "id": "2143",
        "fullName": "Desmond Bane",
        "position": "SG",
        "nbaTeam": "ORL"
      },
      {
        "id": "2145",
        "fullName": "Tre Jones",
        "position": "SG",
        "nbaTeam": "CHI"
      },
      {
        "id": "2152",
        "fullName": "Precious Achiuwa",
        "position": "PF",
        "nbaTeam": "SAC"
      },
      {
        "id": "2453",
        "fullName": "Jalen Williams",
        "position": "PF",
        "nbaTeam": "OKC"
      },
      {
        "id": "2456",
        "fullName": "Keegan Murray",
        "position": "PF",
        "nbaTeam": "SAC"
      },
      {
        "id": "2474",
        "fullName": "Moussa Diabaté",
        "position": "C",
        "nbaTeam": "CHA"
      },
      {
        "id": "2577",
        "fullName": "Victor Wembanyama",
        "position": "C",
        "nbaTeam": "SAS"
      },
      {
        "id": "2580",
        "fullName": "Keyonte George",
        "position": "PG",
        "nbaTeam": "UTA"
      },
      {
        "id": "4761",
        "fullName": "Khaman Maluach",
        "position": "C",
        "nbaTeam": "PHX"
      },
      {
        "id": "4804",
        "fullName": "Caleb Love",
        "position": "PG",
        "nbaTeam": "PHI"
      },
      {
        "id": "4880",
        "fullName": "Allen Graves",
        "position": "PF",
        "nbaTeam": "TOR"
      },
      {
        "id": "4913",
        "fullName": "Baba Miller",
        "position": "SF",
        "nbaTeam": "LAC"
      }
    ],
    "featuredPlayerIds": [
      "2577",
      "2126",
      "1967"
    ],
    "previousSeason": {
      "season": "2025",
      "wins": 13,
      "losses": 8,
      "finish": 3,
      "ownerNote": null
    },
    "opener": {
      "leagueWeek": 1,
      "opponentId": "3"
    },
    "recentMove": {
      "dateLabel": "Oct 5",
      "text": "Dropped Joan Beringer."
    }
  },
  {
    "identity": {
      "id": "5",
      "name": "Josh Diddy’s Roster",
      "managerName": "vannweinkauf",
      "avatar": "d55d1f7075eda01948318de4af616075"
    },
    "currentRecord": {
      "wins": 0,
      "losses": 0,
      "ties": 0
    },
    "players": [
      {
        "id": "1082",
        "fullName": "Draymond Green",
        "position": "PF",
        "nbaTeam": "GSW"
      },
      {
        "id": "1085",
        "fullName": "Stephen Curry",
        "position": "PG",
        "nbaTeam": "GSW"
      },
      {
        "id": "1240",
        "fullName": "James Harden",
        "position": "PG",
        "nbaTeam": "CLE"
      },
      {
        "id": "1265",
        "fullName": "Jrue Holiday",
        "position": "PG",
        "nbaTeam": "POR"
      },
      {
        "id": "1526",
        "fullName": "Zach LaVine",
        "position": "SG",
        "nbaTeam": "SAC"
      },
      {
        "id": "1585",
        "fullName": "Aaron Gordon",
        "position": "PF",
        "nbaTeam": "DEN"
      },
      {
        "id": "1613",
        "fullName": "Karl-Anthony Towns",
        "position": "C",
        "nbaTeam": "NYK"
      },
      {
        "id": "1658",
        "fullName": "Nikola Jokić",
        "position": "C",
        "nbaTeam": "DEN"
      },
      {
        "id": "1698",
        "fullName": "Brandon Ingram",
        "position": "SF",
        "nbaTeam": "LAC"
      },
      {
        "id": "1713",
        "fullName": "Dejounte Murray",
        "position": "PG",
        "nbaTeam": "NOP"
      },
      {
        "id": "1717",
        "fullName": "Fred VanVleet",
        "position": "PG",
        "nbaTeam": "HOU"
      },
      {
        "id": "1822",
        "fullName": "Jayson Tatum",
        "position": "SF",
        "nbaTeam": "BOS"
      },
      {
        "id": "2275",
        "fullName": "Day'Ron Sharpe",
        "position": "C",
        "nbaTeam": "BKN"
      },
      {
        "id": "2284",
        "fullName": "Jalen Johnson",
        "position": "PF",
        "nbaTeam": "ATL"
      },
      {
        "id": "2301",
        "fullName": "Davion Mitchell",
        "position": "PG",
        "nbaTeam": "MIA"
      },
      {
        "id": "2309",
        "fullName": "Jalen Green",
        "position": "SG",
        "nbaTeam": "PHX"
      },
      {
        "id": "2313",
        "fullName": "Josh Giddey",
        "position": "PG",
        "nbaTeam": "CHI"
      },
      {
        "id": "4744",
        "fullName": "Egor Dëmin",
        "position": "SG",
        "nbaTeam": "BKN"
      },
      {
        "id": "4793",
        "fullName": "Maxime Raynaud",
        "position": "C",
        "nbaTeam": "SAC"
      },
      {
        "id": "4872",
        "fullName": "Karim Lopez",
        "position": "PF",
        "nbaTeam": "MEM"
      },
      {
        "id": "4883",
        "fullName": "Brayden Burries",
        "position": "PG",
        "nbaTeam": "MIL"
      },
      {
        "id": "4887",
        "fullName": "Koa Peat",
        "position": "PF",
        "nbaTeam": "PHX"
      }
    ],
    "featuredPlayerIds": [
      "1658",
      "1085",
      "1822"
    ],
    "previousSeason": {
      "season": "2025",
      "wins": 17,
      "losses": 4,
      "finish": 1,
      "ownerNote": null
    },
    "opener": {
      "leagueWeek": 1,
      "opponentId": "1"
    },
    "recentMove": {
      "dateLabel": "Oct 5",
      "text": "Dropped Bobby Portis; Added Davion Mitchell."
    }
  },
  {
    "identity": {
      "id": "6",
      "name": "Huff n’ Puff",
      "managerName": "GriffinHealy",
      "avatar": "4550e09a58a33d3c34bf8e7f7cfa198f"
    },
    "currentRecord": {
      "wins": 0,
      "losses": 0,
      "ties": 0
    },
    "players": [
      {
        "id": "1000",
        "fullName": "Jimmy Butler",
        "position": "SF",
        "nbaTeam": "GSW"
      },
      {
        "id": "1716",
        "fullName": "Pascal Siakam",
        "position": "PF",
        "nbaTeam": "IND"
      },
      {
        "id": "1787",
        "fullName": "Jarrett Allen",
        "position": "C",
        "nbaTeam": "CLE"
      },
      {
        "id": "1831",
        "fullName": "OG Anunoby",
        "position": "PF",
        "nbaTeam": "NYK"
      },
      {
        "id": "1845",
        "fullName": "Donovan Mitchell",
        "position": "SG",
        "nbaTeam": "CLE"
      },
      {
        "id": "1872",
        "fullName": "De'Aaron Fox",
        "position": "PG",
        "nbaTeam": "SAS"
      },
      {
        "id": "1887",
        "fullName": "Mitchell Robinson",
        "position": "C",
        "nbaTeam": "BOS"
      },
      {
        "id": "1924",
        "fullName": "Jaren Jackson",
        "position": "C",
        "nbaTeam": "UTA"
      },
      {
        "id": "2267",
        "fullName": "Cade Cunningham",
        "position": "PG",
        "nbaTeam": "DET"
      },
      {
        "id": "2286",
        "fullName": "Herbert Jones",
        "position": "PF",
        "nbaTeam": "NOP"
      },
      {
        "id": "2296",
        "fullName": "Sandro Mamukelashvili",
        "position": "C",
        "nbaTeam": "LAL"
      },
      {
        "id": "2329",
        "fullName": "Sam Hauser",
        "position": "PF",
        "nbaTeam": "BOS"
      },
      {
        "id": "2417",
        "fullName": "AJ Green",
        "position": "SG",
        "nbaTeam": "MIL"
      },
      {
        "id": "2574",
        "fullName": "Amen Thompson",
        "position": "SG",
        "nbaTeam": "HOU"
      },
      {
        "id": "2752",
        "fullName": "Cam Spencer",
        "position": "SG",
        "nbaTeam": "MEM"
      },
      {
        "id": "2836",
        "fullName": "Ronald Holland",
        "position": "PF",
        "nbaTeam": "DET"
      },
      {
        "id": "4753",
        "fullName": "Carter Bryant",
        "position": "PF",
        "nbaTeam": "SAS"
      },
      {
        "id": "4765",
        "fullName": "Jase Richardson",
        "position": "PG",
        "nbaTeam": "ORL"
      },
      {
        "id": "4767",
        "fullName": "Mohamed Diawara",
        "position": "SF",
        "nbaTeam": "NYK"
      },
      {
        "id": "4867",
        "fullName": "Ebuka Okorie",
        "position": "PG",
        "nbaTeam": "DET"
      },
      {
        "id": "4869",
        "fullName": "Hannes Steinbach",
        "position": "C",
        "nbaTeam": "CHA"
      },
      {
        "id": "4870",
        "fullName": "Joshua Jefferson",
        "position": "PF",
        "nbaTeam": "BKN"
      },
      {
        "id": "4905",
        "fullName": "Henri Veesaar",
        "position": "C",
        "nbaTeam": "ATL"
      }
    ],
    "featuredPlayerIds": [
      "2267",
      "1845",
      "2574"
    ],
    "previousSeason": {
      "season": "2025",
      "wins": 10,
      "losses": 11,
      "finish": 8,
      "ownerNote": null
    },
    "opener": {
      "leagueWeek": 1,
      "opponentId": "10"
    },
    "recentMove": {
      "dateLabel": "Oct 5",
      "text": "Added Sandro Mamukelashvili."
    }
  },
  {
    "identity": {
      "id": "7",
      "name": "papichooter",
      "managerName": "papichooter",
      "avatar": "8eb8f8bf999945d523f2c4033f70473e"
    },
    "currentRecord": {
      "wins": 0,
      "losses": 0,
      "ties": 0
    },
    "players": [
      {
        "id": "1074",
        "fullName": "Paul George",
        "position": "SF",
        "nbaTeam": "BOS"
      },
      {
        "id": "1321",
        "fullName": "DeMar DeRozan",
        "position": "SF",
        "nbaTeam": "DEN"
      },
      {
        "id": "1535",
        "fullName": "Julius Randle",
        "position": "PF",
        "nbaTeam": "BKN"
      },
      {
        "id": "1718",
        "fullName": "Jakob Poeltl",
        "position": "C",
        "nbaTeam": "TOR"
      },
      {
        "id": "1970",
        "fullName": "Luka Dončić",
        "position": "PG",
        "nbaTeam": "LAL"
      },
      {
        "id": "2007",
        "fullName": "Darius Garland",
        "position": "PG",
        "nbaTeam": "LAC"
      },
      {
        "id": "2009",
        "fullName": "Kevin Porter",
        "position": "PG",
        "nbaTeam": "MIL"
      },
      {
        "id": "2131",
        "fullName": "Saddiq Bey",
        "position": "SF",
        "nbaTeam": "NOP"
      },
      {
        "id": "2161",
        "fullName": "Tyrese Haliburton",
        "position": "PG",
        "nbaTeam": "IND"
      },
      {
        "id": "2181",
        "fullName": "Deni Avdija",
        "position": "PF",
        "nbaTeam": "POR"
      },
      {
        "id": "2255",
        "fullName": "Ayo Dosunmu",
        "position": "SG",
        "nbaTeam": "MIN"
      },
      {
        "id": "2258",
        "fullName": "Quentin Grimes",
        "position": "PG",
        "nbaTeam": "LAL"
      },
      {
        "id": "2306",
        "fullName": "Jonathan Kuminga",
        "position": "PF",
        "nbaTeam": "MIN"
      },
      {
        "id": "2438",
        "fullName": "Jalen Duren",
        "position": "C",
        "nbaTeam": "DET"
      },
      {
        "id": "2455",
        "fullName": "Chet Holmgren",
        "position": "C",
        "nbaTeam": "OKC"
      },
      {
        "id": "2566",
        "fullName": "Ausar Thompson",
        "position": "SG",
        "nbaTeam": "DET"
      },
      {
        "id": "2620",
        "fullName": "Scoot Henderson",
        "position": "PG",
        "nbaTeam": "POR"
      },
      {
        "id": "2713",
        "fullName": "Jared McCain",
        "position": "SG",
        "nbaTeam": "OKC"
      },
      {
        "id": "4748",
        "fullName": "Cedric Coward",
        "position": "SG",
        "nbaTeam": "MEM"
      },
      {
        "id": "4778",
        "fullName": "Sion James",
        "position": "SF",
        "nbaTeam": "CHA"
      },
      {
        "id": "4885",
        "fullName": "Morez Johnson",
        "position": "C",
        "nbaTeam": "DAL"
      },
      {
        "id": "4888",
        "fullName": "Aday Mara",
        "position": "C",
        "nbaTeam": "OKC"
      },
      {
        "id": "4915",
        "fullName": "Ryan Conwell",
        "position": "SG",
        "nbaTeam": "MIA"
      }
    ],
    "featuredPlayerIds": [
      "1970",
      "2455",
      "2161"
    ],
    "previousSeason": {
      "season": "2025",
      "wins": 16,
      "losses": 5,
      "finish": 2,
      "ownerNote": null
    },
    "opener": {
      "leagueWeek": 1,
      "opponentId": "9"
    },
    "recentMove": {
      "dateLabel": "Oct 5",
      "text": "Dropped Gui Santos."
    }
  },
  {
    "identity": {
      "id": "8",
      "name": "NeuralNets",
      "managerName": "NeuralNets",
      "avatar": "91d302c68154a3d348ad76fb1e0b83c9"
    },
    "currentRecord": {
      "wins": 0,
      "losses": 0,
      "ties": 0
    },
    "players": [
      {
        "id": "1350",
        "fullName": "Rudy Gobert",
        "position": "C",
        "nbaTeam": "MIN"
      },
      {
        "id": "1380",
        "fullName": "Giannis Antetokounmpo",
        "position": "PF",
        "nbaTeam": "MIA"
      },
      {
        "id": "1433",
        "fullName": "Kevin Durant",
        "position": "SF",
        "nbaTeam": "HOU"
      },
      {
        "id": "1590",
        "fullName": "Kristaps Porziņģis",
        "position": "C",
        "nbaTeam": "GSW"
      },
      {
        "id": "1637",
        "fullName": "Norman Powell",
        "position": "SF",
        "nbaTeam": "CHI"
      },
      {
        "id": "1697",
        "fullName": "Ivica Zubac",
        "position": "C",
        "nbaTeam": "IND"
      },
      {
        "id": "1752",
        "fullName": "Lauri Markkanen",
        "position": "PF",
        "nbaTeam": "UTA"
      },
      {
        "id": "1892",
        "fullName": "Collin Sexton",
        "position": "SG",
        "nbaTeam": "LAL"
      },
      {
        "id": "1997",
        "fullName": "Daniel Gafford",
        "position": "C",
        "nbaTeam": "DAL"
      },
      {
        "id": "2086",
        "fullName": "Tyler Herro",
        "position": "SG",
        "nbaTeam": "MIL"
      },
      {
        "id": "2135",
        "fullName": "Jaden McDaniels",
        "position": "SF",
        "nbaTeam": "MIN"
      },
      {
        "id": "2136",
        "fullName": "Onyeka Okongwu",
        "position": "C",
        "nbaTeam": "ATL"
      },
      {
        "id": "2179",
        "fullName": "LaMelo Ball",
        "position": "PG",
        "nbaTeam": "MIN"
      },
      {
        "id": "2449",
        "fullName": "Dyson Daniels",
        "position": "SG",
        "nbaTeam": "ATL"
      },
      {
        "id": "2835",
        "fullName": "Matas Buzelis",
        "position": "PF",
        "nbaTeam": "CHI"
      },
      {
        "id": "4741",
        "fullName": "Liam McNeeley",
        "position": "SF",
        "nbaTeam": "CHA"
      },
      {
        "id": "4791",
        "fullName": "Rasheer Fleming",
        "position": "PF",
        "nbaTeam": "PHX"
      },
      {
        "id": "4808",
        "fullName": "Ryan Nembhard",
        "position": "PG",
        "nbaTeam": "DEN"
      },
      {
        "id": "4863",
        "fullName": "Dailyn Swain",
        "position": "PF",
        "nbaTeam": "CHI"
      },
      {
        "id": "4866",
        "fullName": "AJ Dybantsa",
        "position": "PF",
        "nbaTeam": "WAS"
      },
      {
        "id": "4881",
        "fullName": "Keaton Wagler",
        "position": "PG",
        "nbaTeam": "LAC"
      },
      {
        "id": "4882",
        "fullName": "Darryn Peterson",
        "position": "PG",
        "nbaTeam": "UTA"
      }
    ],
    "featuredPlayerIds": [
      "1380",
      "2179",
      "4866"
    ],
    "previousSeason": {
      "season": "2025",
      "wins": 1,
      "losses": 20,
      "finish": 10,
      "ownerNote": "Under the previous manager as QBs Gremlins."
    },
    "opener": {
      "leagueWeek": 1,
      "opponentId": "2"
    },
    "recentMove": {
      "dateLabel": "Oct 6",
      "text": "Dropped Malik Monk, Nikola Jović."
    }
  },
  {
    "identity": {
      "id": "9",
      "name": "Lebron Theme Team",
      "managerName": "lordlx",
      "avatar": "7572250c2fb084c434fed0e82229e183"
    },
    "currentRecord": {
      "wins": 0,
      "losses": 0,
      "ties": 0
    },
    "players": [
      {
        "id": "1362",
        "fullName": "LeBron James",
        "position": "PF",
        "nbaTeam": "PHI"
      },
      {
        "id": "1450",
        "fullName": "CJ McCollum",
        "position": "PG",
        "nbaTeam": "ATL"
      },
      {
        "id": "1525",
        "fullName": "Andrew Wiggins",
        "position": "SF",
        "nbaTeam": "MIA"
      },
      {
        "id": "1604",
        "fullName": "Kelly Oubre",
        "position": "PF",
        "nbaTeam": "IND"
      },
      {
        "id": "1803",
        "fullName": "Josh Hart",
        "position": "SG",
        "nbaTeam": "NYK"
      },
      {
        "id": "1934",
        "fullName": "Isaiah Hartenstein",
        "position": "C",
        "nbaTeam": "OKC"
      },
      {
        "id": "1945",
        "fullName": "Trae Young",
        "position": "PG",
        "nbaTeam": "WAS"
      },
      {
        "id": "1964",
        "fullName": "Donte DiVincenzo",
        "position": "SG",
        "nbaTeam": "MIN"
      },
      {
        "id": "2040",
        "fullName": "Ja Morant",
        "position": "PG",
        "nbaTeam": "POR"
      },
      {
        "id": "2091",
        "fullName": "Cameron Johnson",
        "position": "SF",
        "nbaTeam": "DEN"
      },
      {
        "id": "2445",
        "fullName": "Jabari Smith",
        "position": "PF",
        "nbaTeam": "HOU"
      },
      {
        "id": "2447",
        "fullName": "Tari Eason",
        "position": "SG",
        "nbaTeam": "HOU"
      },
      {
        "id": "2463",
        "fullName": "Ryan Rollins",
        "position": "PG",
        "nbaTeam": "MIL"
      },
      {
        "id": "2584",
        "fullName": "Dereck Lively",
        "position": "C",
        "nbaTeam": "DAL"
      },
      {
        "id": "2733",
        "fullName": "Alex Sarr",
        "position": "C",
        "nbaTeam": "WAS"
      },
      {
        "id": "4754",
        "fullName": "Dylan Harper",
        "position": "SG",
        "nbaTeam": "SAS"
      },
      {
        "id": "4755",
        "fullName": "Collin Murray-Boyles",
        "position": "C",
        "nbaTeam": "TOR"
      },
      {
        "id": "4760",
        "fullName": "Cooper Flagg",
        "position": "SG",
        "nbaTeam": "DAL"
      },
      {
        "id": "4868",
        "fullName": "Christian Anderson",
        "position": "PG",
        "nbaTeam": "CHA"
      },
      {
        "id": "4873",
        "fullName": "Cameron Boozer",
        "position": "C",
        "nbaTeam": "MEM"
      },
      {
        "id": "4895",
        "fullName": "Meleek Thomas",
        "position": "SG",
        "nbaTeam": "CLE"
      }
    ],
    "featuredPlayerIds": [
      "1362",
      "1945",
      "4760"
    ],
    "previousSeason": {
      "season": "2025",
      "wins": 6,
      "losses": 15,
      "finish": 9,
      "ownerNote": null
    },
    "opener": {
      "leagueWeek": 1,
      "opponentId": "7"
    },
    "recentMove": {
      "dateLabel": "Oct 7",
      "text": "Dropped Lonzo Ball."
    }
  },
  {
    "identity": {
      "id": "10",
      "name": "T Halibooty",
      "managerName": "TyreseHalibooty",
      "avatar": "578c6b253dd7b4bab45382e1af102204"
    },
    "currentRecord": {
      "wins": 0,
      "losses": 0,
      "ties": 0
    },
    "players": [
      {
        "id": "1272",
        "fullName": "Anthony Davis",
        "position": "C",
        "nbaTeam": "WAS"
      },
      {
        "id": "1583",
        "fullName": "Jusuf Nurkić",
        "position": "C",
        "nbaTeam": "UTA"
      },
      {
        "id": "1648",
        "fullName": "Devin Booker",
        "position": "SG",
        "nbaTeam": "PHX"
      },
      {
        "id": "1711",
        "fullName": "Jaylen Brown",
        "position": "SF",
        "nbaTeam": "PHI"
      },
      {
        "id": "1747",
        "fullName": "Jamal Murray",
        "position": "PG",
        "nbaTeam": "DEN"
      },
      {
        "id": "1846",
        "fullName": "Bam Adebayo",
        "position": "C",
        "nbaTeam": "MIA"
      },
      {
        "id": "1974",
        "fullName": "Deandre Ayton",
        "position": "C",
        "nbaTeam": "WAS"
      },
      {
        "id": "1975",
        "fullName": "Mikal Bridges",
        "position": "SF",
        "nbaTeam": "NYK"
      },
      {
        "id": "2144",
        "fullName": "Aaron Nesmith",
        "position": "SF",
        "nbaTeam": "IND"
      },
      {
        "id": "2302",
        "fullName": "Neemias Queta",
        "position": "C",
        "nbaTeam": "BOS"
      },
      {
        "id": "2305",
        "fullName": "Jalen Suggs",
        "position": "PG",
        "nbaTeam": "ORL"
      },
      {
        "id": "2422",
        "fullName": "Collin Gillespie",
        "position": "PG",
        "nbaTeam": "PHX"
      },
      {
        "id": "2441",
        "fullName": "Walker Kessler",
        "position": "C",
        "nbaTeam": "LAL"
      },
      {
        "id": "2565",
        "fullName": "Bilal Coulibaly",
        "position": "SF",
        "nbaTeam": "WAS"
      },
      {
        "id": "2583",
        "fullName": "Jaime Jaquez",
        "position": "PF",
        "nbaTeam": "MIL"
      },
      {
        "id": "2714",
        "fullName": "Kyshawn George",
        "position": "SF",
        "nbaTeam": "WAS"
      },
      {
        "id": "2719",
        "fullName": "Reed Sheppard",
        "position": "PG",
        "nbaTeam": "HOU"
      },
      {
        "id": "4738",
        "fullName": "Tre Johnson",
        "position": "SG",
        "nbaTeam": "WAS"
      },
      {
        "id": "4764",
        "fullName": "Nique Clifford",
        "position": "SG",
        "nbaTeam": "SAC"
      },
      {
        "id": "4862",
        "fullName": "Caleb Wilson",
        "position": "PF",
        "nbaTeam": "CHI"
      },
      {
        "id": "4874",
        "fullName": "Cameron Carr",
        "position": "PG",
        "nbaTeam": "LAL"
      },
      {
        "id": "4877",
        "fullName": "Chris Cenac",
        "position": "C",
        "nbaTeam": "BOS"
      }
    ],
    "featuredPlayerIds": [
      "1648",
      "1272",
      "1846"
    ],
    "previousSeason": {
      "season": "2025",
      "wins": 10,
      "losses": 11,
      "finish": 6,
      "ownerNote": null
    },
    "opener": {
      "leagueWeek": 1,
      "opponentId": "6"
    },
    "recentMove": {
      "dateLabel": "Oct 6",
      "text": "Dropped Zaccharie Risacher."
    }
  }
];
