#!/usr/bin/env python3
"""Fetch MLB standings from statsapi.mlb.com and write docs/standings.json."""
import json
import os
import requests
from datetime import datetime, timezone

TEAM_CN = {
    'Houston Astros': '太空人', 'Los Angeles Angels': '天使',
    'Oakland Athletics': '運動家', 'Sacramento River Cats': '運動家',
    'Seattle Mariners': '水手', 'Texas Rangers': '遊騎兵',
    'Chicago White Sox': '白襪', 'Cleveland Guardians': '守護者',
    'Detroit Tigers': '老虎', 'Kansas City Royals': '皇家',
    'Minnesota Twins': '雙城', 'Baltimore Orioles': '金鶯',
    'Boston Red Sox': '紅襪', 'New York Yankees': '洋基',
    'Tampa Bay Rays': '光芒', 'Toronto Blue Jays': '藍鳥',
    'Arizona Diamondbacks': '響尾蛇', 'Colorado Rockies': '落磯',
    'Los Angeles Dodgers': '道奇', 'San Diego Padres': '教士',
    'San Francisco Giants': '巨人', 'Chicago Cubs': '小熊',
    'Cincinnati Reds': '紅人', 'Milwaukee Brewers': '釀酒人',
    'Pittsburgh Pirates': '海盜', 'St. Louis Cardinals': '紅雀',
    'Atlanta Braves': '勇士', 'Miami Marlins': '馬林魚',
    'New York Mets': '大都會', 'Philadelphia Phillies': '費城人',
    'Washington Nationals': '國民',
}

TEAM_ABBR = {
    'Houston Astros': 'HOU', 'Los Angeles Angels': 'LAA',
    'Oakland Athletics': 'OAK', 'Seattle Mariners': 'SEA',
    'Texas Rangers': 'TEX', 'Chicago White Sox': 'CWS',
    'Cleveland Guardians': 'CLE', 'Detroit Tigers': 'DET',
    'Kansas City Royals': 'KC', 'Minnesota Twins': 'MIN',
    'Baltimore Orioles': 'BAL', 'Boston Red Sox': 'BOS',
    'New York Yankees': 'NYY', 'Tampa Bay Rays': 'TB',
    'Toronto Blue Jays': 'TOR', 'Arizona Diamondbacks': 'ARI',
    'Colorado Rockies': 'COL', 'Los Angeles Dodgers': 'LAD',
    'San Diego Padres': 'SD', 'San Francisco Giants': 'SF',
    'Chicago Cubs': 'CHC', 'Cincinnati Reds': 'CIN',
    'Milwaukee Brewers': 'MIL', 'Pittsburgh Pirates': 'PIT',
    'St. Louis Cardinals': 'STL', 'Atlanta Braves': 'ATL',
    'Miami Marlins': 'MIA', 'New York Mets': 'NYM',
    'Philadelphia Phillies': 'PHI', 'Washington Nationals': 'WSH',
}

DIV_CN = {
    'American League East': '美聯東區',
    'American League Central': '美聯中區',
    'American League West': '美聯西區',
    'National League East': '國聯東區',
    'National League Central': '國聯中區',
    'National League West': '國聯西區',
}

DIV_ORDER = {201: 0, 202: 1, 200: 2, 204: 3, 205: 4, 203: 5}


def parse_team(tr, rank):
    name = tr['team']['name']
    tid = tr['team']['id']
    splits = {s['type']: s for s in tr.get('records', {}).get('splitRecords', [])}
    l10 = splits.get('lastTen', {})
    home = splits.get('home', {})
    away = splits.get('away', {})
    streak = tr.get('streak', {})
    gb = tr.get('gamesBack', '-')
    if gb == '0.0':
        gb = '-'
    return {
        'rank': rank,
        'team_id': tid,
        'team': name,
        'team_cn': TEAM_CN.get(name, name),
        'abbr': TEAM_ABBR.get(name, name[:3].upper()),
        'w': tr['wins'],
        'l': tr['losses'],
        'pct': float(tr.get('winningPercentage', 0)),
        'gb': gb,
        'rs': tr.get('runsScored', 0),
        'ra': tr.get('runsAllowed', 0),
        'diff': tr.get('runDifferential', 0),
        'l10': f"{l10.get('wins', 0)}-{l10.get('losses', 0)}",
        'strk': streak.get('streakCode', '-'),
        'home': f"{home.get('wins', 0)}-{home.get('losses', 0)}",
        'away': f"{away.get('wins', 0)}-{away.get('losses', 0)}",
    }


def fetch():
    year = datetime.now(timezone.utc).year
    url = (
        f'https://statsapi.mlb.com/api/v1/standings'
        f'?leagueId=103,104&season={year}&standingsTypes=regularSeason'
        f'&hydrate=team,league,division,streak,records,runDifferential'
    )
    headers = {
        'User-Agent': 'Mozilla/5.0 (compatible; mlb-standings-bot/1.0)',
        'Accept': 'application/json',
    }
    r = requests.get(url, headers=headers, timeout=20)
    r.raise_for_status()
    data = r.json()

    al_divs, nl_divs, all_teams = [], [], []
    records = sorted(data['records'], key=lambda x: DIV_ORDER.get(x['division']['id'], 99))

    for rec in records:
        league_id = rec['league']['id']
        div_name = rec['division']['name']
        teams = [parse_team(tr, i + 1) for i, tr in enumerate(rec['teamRecords'])]
        div = {'division': div_name, 'division_cn': DIV_CN.get(div_name, div_name), 'teams': teams}
        if league_id == 103:
            al_divs.append(div)
        else:
            nl_divs.append(div)
        all_teams.extend(teams)

    all_teams.sort(key=lambda t: (-t['pct'], -t['w']))
    for i, t in enumerate(all_teams):
        t['rank'] = i + 1

    return {
        'updated': datetime.now(timezone.utc).strftime('%Y-%m-%d'),
        'season': year,
        'al': al_divs,
        'nl': nl_divs,
        'all': all_teams,
    }


def _upload_standings_to_supabase(data: dict):
    sb_url = os.getenv("SUPABASE_URL", "")
    sb_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    if not sb_url or not sb_key:
        return
    try:
        body = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
        url  = f"{sb_url}/storage/v1/object/picks/standings.json"
        r = requests.put(url, data=body, headers={
            "Authorization": f"Bearer {sb_key}",
            "Content-Type": "application/json",
            "x-upsert": "true",
        }, timeout=15)
        print(f"Supabase standings upload: {r.status_code}")
    except Exception as e:
        print(f"Supabase standings upload error: {e}")

if __name__ == '__main__':
    out = fetch()
    path = os.path.join(os.path.dirname(__file__), '..', 'docs', 'standings.json')
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"OK: {out['updated']}  AL={len(out['al'])}div  NL={len(out['nl'])}div  All={len(out['all'])}teams")
    _upload_standings_to_supabase(out)
