export type MemberDataRoles = {
    roleName: string;
    roleId: string;
};

export interface MemberData {
    id: string;
    nickname?: string | undefined | null;
    roles?: Array<MemberDataRoles>;
    avatar?: string | null;
    displayName?: string;
}
