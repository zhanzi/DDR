using System;
using System.Collections.Generic;

namespace SlzrCrossGate.WebAdmin.DTOs
{
    // 角色DTO
    public class RoleDto
    {
        public required string Id { get; set; }
        public required string Name { get; set; }
        public bool IsSysAdmin { get; set; }
        public required string Description { get; set; }
    }

    public class CreateRoleDto
    {
        public required string Name { get; set; }
        public bool IsSysAdmin { get; set; }
    }

    public class UpdateRoleDto
    {
        public string? Name { get; set; }
        public bool IsSysAdmin { get; set; }
    }

    public class RoleUserDto
    {
        public required string Id { get; set; }
        public required string UserName { get; set; }
        public required string Email { get; set; }
        public required string RealName { get; set; }
        public required string MerchantId { get; set; }
        public required List<string> Roles { get; set; }
        public bool EmailConfirmed { get; set; }
        public DateTimeOffset? LockoutEnd { get; set; }
    }
}
