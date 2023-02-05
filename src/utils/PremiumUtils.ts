type MessageCap = 50 | 150 | 300 | 500;
type BackupLimit = 1 | 25 | 35 | 75;

export const fetchPremiumMessagesCap = (premiumLevel: number): MessageCap => {
    switch (premiumLevel) {
        case 0:
            return 50;
        case 1:
            return 150;
        case 2:
            return 300;
        case 3:
            return 500;
        default:
            return 50;
    }
};

export const fetchPremiumBackupLimit = (premiumLevel: number): BackupLimit => {
    switch (premiumLevel) {
        case 0:
            return 1;
        case 1:
            return 25;
        case 2:
            return 35;
        case 3:
            return 75;
        default:
            return 1;
    }
};
