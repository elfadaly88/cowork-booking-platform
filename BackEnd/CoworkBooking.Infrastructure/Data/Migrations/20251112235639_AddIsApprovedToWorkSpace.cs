using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoworkBooking.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddIsApprovedToWorkSpace : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsApproved",
                table: "Workspaces",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsApproved",
                table: "Workspaces");
        }
    }
}
