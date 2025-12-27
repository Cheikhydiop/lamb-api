# Fix requis pour les relations Prisma

Le problème: Les noms de relations dans les includes doivent correspondre EXACTEMENT
aux noms de champs définis dans le schema Prisma.

## Noms corrects selon schema (à utiliser dans includes):

Relations qui doivent rester en **PascalCase**:
- User (relation vers users)  
- Fight (relation vers fights)
- Fighter (relation vers fighters)
- Bet (relation vers bets)
- Wallet (relation vers wallets)
- Transaction (relation vers transactions)
- Notification (relation vers notifications)
- Commission (relation vers commissions)
- Winning (relation vers winnings)
- Session (relation vers sessions)
- OtpCode (relation vers otp_codes)
- UserProfile (relation vers user_profiles)
- DayEvent (relation vers day_events)
- FightResult (relation vers fight_results)
- AuditLog (relation vers audit_logs)

Le sed précédent a tout mis en camelCase, mais le schema Prisma définit
ces relations en PascalCase !

## Solution immédiate:
Annuler le sed précédent et utiliser PascalCase partout dans les includes
